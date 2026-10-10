import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deliverOtp, type OtpChannel } from "@/lib/otp-delivery";

/**
 * Vérification en deux étapes à la connexion (défis OtpChallenge).
 *
 * - Code à 6 chiffres tiré par crypto.randomInt ; seul son HMAC-SHA256 (lié à l'identifiant du défi)
 *   est stocké. OTP_PEPPER (facultatif) sert de clé HMAC : une fuite de la base seule ne suffit
 *   alors plus à retrouver les codes en cours.
 * - Identifiant du défi : 24 octets aléatoires (base64url), renvoyé seulement après un mot de passe correct.
 * - 10 minutes, 5 essais au total (renvois compris), 3 envois maximum, 30 s entre deux envois.
 */

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_MAX_SENDS = 3;
export const OTP_RESEND_SECONDS = 30;
/** Durée de vie maximale d'un défi, renvois compris. */
const OTP_MAX_LIFETIME_MS = 30 * 60_000;
/** Défis créés par compte et par heure (protège aussi contre l'envoi massif de SMS). */
const OTP_MAX_PER_HOUR = 10;

function codeHash(challengeId: string, code: string): string {
  return createHmac("sha256", process.env.OTP_PEPPER || "pwfintech-otp-v1").update(`${challengeId}:${code}`).digest("hex");
}

function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const prefix = phone.trim().startsWith("+") ? phone.trim().split(/\s/)[0] : "";
  const tail = digits.slice(-2);
  return `${prefix && prefix.length <= 5 ? `${prefix} ` : ""}•••• ${tail}`.trim();
}

export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
}

function destination(customer: Customer, channel: OtpChannel) {
  return channel === "sms" ? { to: customer.phone, masked: maskPhone(customer.phone) } : { to: customer.email, masked: maskEmail(customer.email) };
}

export type ChallengeInfo = {
  challengeId: string;
  channel: OtpChannel;
  destination: string;
  expiresAt: string;
  resendAfter: number;
  attemptsLeft: number;
  /** Mode démo uniquement (aucun fournisseur d'envoi configuré). */
  demoCode?: string;
};

export class OtpRateLimitError extends Error {}

async function send(customer: Customer, channel: OtpChannel, code: string) {
  const dest = destination(customer, channel);
  const delivery = await deliverOtp({
    channel,
    to: dest.to,
    code,
    purpose: "login",
    expiresMinutes: OTP_TTL_MINUTES,
    firstName: customer.firstName,
  });
  return { masked: dest.masked, demoCode: delivery.delivered ? undefined : delivery.demoCode };
}

/** Après un mot de passe correct : crée le défi et envoie le code. */
export async function createLoginChallenge(
  customer: Customer,
  opts: { channel?: OtpChannel; device?: string | null; ip?: string | null },
): Promise<ChallengeInfo> {
  const recent = await prisma.otpChallenge.count({
    where: { customerId: customer.id, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= OTP_MAX_PER_HOUR) throw new OtpRateLimitError("Trop de tentatives de connexion. Réessayez dans une heure.");

  const channel = opts.channel ?? "sms";
  const id = randomBytes(24).toString("base64url");
  const code = newCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);
  // Un seul défi actif par compte : les précédents (non utilisés) sont clos.
  await prisma.otpChallenge.updateMany({
    where: { customerId: customer.id, purpose: "login", consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.otpChallenge.create({
    data: {
      id,
      customerId: customer.id,
      purpose: "login",
      channel,
      codeHash: codeHash(id, code),
      device: opts.device?.slice(0, 120) || null,
      ip: opts.ip?.slice(0, 64) || null,
      expiresAt,
    },
  });
  try {
    const sent = await send(customer, channel, code);
    return {
      challengeId: id,
      channel,
      destination: sent.masked,
      expiresAt: expiresAt.toISOString(),
      resendAfter: OTP_RESEND_SECONDS,
      attemptsLeft: OTP_MAX_ATTEMPTS,
      ...(sent.demoCode ? { demoCode: sent.demoCode } : {}),
    };
  } catch (error) {
    await prisma.otpChallenge.update({ where: { id }, data: { consumedAt: new Date() } }).catch(() => undefined);
    throw error;
  }
}

export type ResendResult =
  | { ok: true; info: ChallengeInfo }
  | { ok: false; code: "challenge_expired" | "resend_too_soon" | "resend_limit"; retryAfter?: number };

/** Nouveau code (éventuellement sur l'autre canal). Les essais déjà faits restent comptés. */
export async function resendLoginChallenge(challengeId: string, channel?: OtpChannel): Promise<ResendResult> {
  const ch = await prisma.otpChallenge.findUnique({ where: { id: challengeId }, include: { customer: true } });
  const now = Date.now();
  if (!ch || ch.purpose !== "login" || ch.consumedAt || ch.expiresAt.getTime() <= now || ch.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, code: "challenge_expired" };
  }
  if (ch.customer.status !== "active") return { ok: false, code: "challenge_expired" };
  const wait = Math.ceil((ch.lastSentAt.getTime() + OTP_RESEND_SECONDS * 1000 - now) / 1000);
  if (wait > 0) return { ok: false, code: "resend_too_soon", retryAfter: wait };
  if (ch.sends >= OTP_MAX_SENDS) return { ok: false, code: "resend_limit" };

  const nextChannel = channel ?? (ch.channel === "email" ? "email" : "sms");
  const code = newCode();
  const expiresAt = new Date(Math.min(now + OTP_TTL_MINUTES * 60_000, ch.createdAt.getTime() + OTP_MAX_LIFETIME_MS));
  // Mise à jour conditionnelle : deux renvois simultanés ne peuvent pas dépasser la limite.
  const { count } = await prisma.otpChallenge.updateMany({
    where: { id: ch.id, consumedAt: null, sends: ch.sends },
    data: { codeHash: codeHash(ch.id, code), channel: nextChannel, sends: { increment: 1 }, lastSentAt: new Date(now), expiresAt },
  });
  if (!count) return { ok: false, code: "resend_too_soon", retryAfter: OTP_RESEND_SECONDS };
  const sent = await send(ch.customer, nextChannel, code);
  return {
    ok: true,
    info: {
      challengeId: ch.id,
      channel: nextChannel,
      destination: sent.masked,
      expiresAt: expiresAt.toISOString(),
      resendAfter: OTP_RESEND_SECONDS,
      attemptsLeft: Math.max(0, OTP_MAX_ATTEMPTS - ch.attempts),
      ...(sent.demoCode ? { demoCode: sent.demoCode } : {}),
    },
  };
}

export type VerifyResult =
  | { ok: true; customer: Customer; device: string | null }
  | { ok: false; code: "invalid_code"; attemptsLeft: number }
  | { ok: false; code: "challenge_expired" | "too_many_attempts" | "suspended" };

/** Vérifie le code ; le défi est consommé au premier succès (un code ne sert qu'une fois). */
export async function verifyLoginChallenge(challengeId: string, code: string): Promise<VerifyResult> {
  const ch = await prisma.otpChallenge.findUnique({ where: { id: challengeId }, include: { customer: true } });
  const now = Date.now();
  if (!ch || ch.purpose !== "login" || ch.consumedAt || ch.expiresAt.getTime() <= now) return { ok: false, code: "challenge_expired" };
  if (ch.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, code: "too_many_attempts" };

  // L'essai est compté avant la comparaison (atomique : pas de dépassement par requêtes parallèles).
  const counted = await prisma.otpChallenge.updateMany({
    where: { id: ch.id, consumedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (!counted.count) return { ok: false, code: "too_many_attempts" };

  const expected = Buffer.from(ch.codeHash, "hex");
  const actual = Buffer.from(codeHash(ch.id, code), "hex");
  const match = /^\d{6}$/.test(code) && expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!match) {
    const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - ch.attempts - 1);
    if (attemptsLeft === 0) return { ok: false, code: "too_many_attempts" };
    return { ok: false, code: "invalid_code", attemptsLeft };
  }

  const consumed = await prisma.otpChallenge.updateMany({ where: { id: ch.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (!consumed.count) return { ok: false, code: "challenge_expired" };

  const customer = await prisma.customer.findUnique({ where: { id: ch.customerId } });
  if (!customer) return { ok: false, code: "challenge_expired" };
  if (customer.status !== "active") return { ok: false, code: "suspended" };
  // Mot de passe changé (ou réinitialisé par l'équipe) depuis le début de la connexion : on recommence.
  if (customer.passwordChangedAt && customer.passwordChangedAt.getTime() > ch.createdAt.getTime()) return { ok: false, code: "challenge_expired" };
  return { ok: true, customer, device: ch.device };
}

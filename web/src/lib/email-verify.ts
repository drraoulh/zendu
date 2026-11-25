import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { deliverSignupEmailCode } from "@/lib/otp-delivery";

/**
 * Vérification du courriel pendant l'inscription.
 * Le client reçoit un code à 6 chiffres (10 minutes, 5 essais, 3 envois, 30 s entre deux envois) ; le défi réussi
 * (identifiant renvoyé par /email-verify) sert de preuve à l'inscription et ne peut servir qu'une fois, pour ce courriel.
 * Seul le HMAC du code est stocké (même clé que les codes de connexion, voir otp.ts).
 */
export const EMAIL_CODE_TTL_MINUTES = 10;
export const EMAIL_MAX_ATTEMPTS = 5;
export const EMAIL_MAX_SENDS = 3;
export const EMAIL_RESEND_SECONDS = 30;
/** Une preuve réussie reste utilisable 30 minutes. */
const PROOF_LIFETIME_MS = 30 * 60_000;

function pepper(): string {
  const p = process.env.OTP_PEPPER?.trim();
  if (p) return p;
  const base = process.env.ADMIN_SESSION_SECRET?.trim();
  if (base) return createHmac("sha256", base).update("otp-pepper").digest("hex");
  if (process.env.NODE_ENV === "production") throw new Error("OTP_PEPPER (ou ADMIN_SESSION_SECRET) manquant");
  return "pwfintech-otp-dev";
}

const hash = (id: string, code: string) => createHmac("sha256", pepper()).update(`email:${id}:${code}`).digest("hex");
const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

/** Envoie un code ; avec `challengeId`, renvoie un nouveau code sur le même défi. */
export async function sendEmailCode(
  emailRaw: string,
  firstName: string,
  challengeId?: string,
): Promise<{ ok: true; challengeId: string; resendAfter: number } | { ok: false; code: "resend_too_soon" | "resend_limit" | "expired"; retryAfter?: number }> {
  const email = normalizeEmail(emailRaw);
  const now = Date.now();
  const code = newCode();
  if (challengeId) {
    const c = await prisma.emailVerification.findUnique({ where: { id: challengeId } });
    if (!c || c.email !== email || c.usedAt || c.createdAt.getTime() + PROOF_LIFETIME_MS < now) return { ok: false, code: "expired" };
    if (c.sends >= EMAIL_MAX_SENDS) return { ok: false, code: "resend_limit" };
    const wait = Math.ceil((c.lastSentAt.getTime() + EMAIL_RESEND_SECONDS * 1000 - now) / 1000);
    if (wait > 0) return { ok: false, code: "resend_too_soon", retryAfter: wait };
    await deliverSignupEmailCode(email, firstName, code, EMAIL_CODE_TTL_MINUTES);
    await prisma.emailVerification.update({
      where: { id: c.id },
      data: { codeHash: hash(c.id, code), sends: { increment: 1 }, lastSentAt: new Date(now), expiresAt: new Date(now + EMAIL_CODE_TTL_MINUTES * 60_000), attempts: 0, verifiedAt: null },
    });
    return { ok: true, challengeId: c.id, resendAfter: EMAIL_RESEND_SECONDS };
  }
  const id = randomBytes(24).toString("base64url");
  // Envoi d'abord : si le courriel ne part pas, aucun défi inutile n'est créé.
  await deliverSignupEmailCode(email, firstName, code, EMAIL_CODE_TTL_MINUTES);
  await prisma.emailVerification.create({
    data: { id, email, codeHash: hash(id, code), expiresAt: new Date(now + EMAIL_CODE_TTL_MINUTES * 60_000) },
  });
  return { ok: true, challengeId: id, resendAfter: EMAIL_RESEND_SECONDS };
}

export async function checkEmailCode(
  challengeId: string,
  codeRaw: string,
): Promise<{ ok: true } | { ok: false; code: "wrong_code" | "expired" | "too_many"; left?: number }> {
  const c = await prisma.emailVerification.findUnique({ where: { id: challengeId } });
  const now = Date.now();
  if (!c || c.usedAt || c.expiresAt.getTime() < now) return { ok: false, code: "expired" };
  if (c.verifiedAt) return { ok: true };
  if (c.attempts >= EMAIL_MAX_ATTEMPTS) return { ok: false, code: "too_many" };
  const code = codeRaw.replace(/\D/g, "");
  const a = Buffer.from(hash(c.id, code));
  const b = Buffer.from(c.codeHash);
  const good = code.length === 6 && a.length === b.length && timingSafeEqual(a, b);
  if (!good) {
    const updated = await prisma.emailVerification.update({ where: { id: c.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, code: "wrong_code", left: Math.max(0, EMAIL_MAX_ATTEMPTS - updated.attempts) };
  }
  await prisma.emailVerification.update({ where: { id: c.id }, data: { verifiedAt: new Date(now) } });
  return { ok: true };
}

/** À l'inscription : la preuve est-elle valable pour ce courriel ? Elle est consommée (une seule fois). */
export async function consumeEmailProof(challengeId: string, emailRaw: string): Promise<boolean> {
  const email = normalizeEmail(emailRaw);
  const { count } = await prisma.emailVerification.updateMany({
    where: { id: challengeId, email, verifiedAt: { not: null }, usedAt: null, createdAt: { gte: new Date(Date.now() - PROOF_LIFETIME_MS) } },
    data: { usedAt: new Date() },
  });
  return count === 1;
}

export function emailVerificationRequired(): boolean {
  return process.env.EMAIL_VERIFY_REQUIRED === "1";
}

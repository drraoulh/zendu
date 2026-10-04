import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import type { Customer, CustomerSession } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Comptes clients de l'application WorldSoft Transfer.
 *
 * - Mot de passe : scrypt (N=16384, r=8, p=1) + sel aléatoire, format "scrypt$16384$<sel>$<hash>".
 * - Session : jeton aléatoire de 32 octets envoyé en `Authorization: Bearer …` ; seule son empreinte
 *   SHA-256 est stockée (CustomerSession = un « appareil connecté », révocable).
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;
const N = 16384;
export const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, n, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Règles communes à l'appli : 8 caractères, majuscule, minuscule, chiffre, caractère spécial. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Le mot de passe doit contenir une majuscule et une minuscule.";
  if (!/\d/.test(password)) return "Le mot de passe doit contenir un chiffre.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Le mot de passe doit contenir un caractère spécial.";
  return null;
}

/** Mot de passe temporaire lisible, conforme aux règles (donné par l'équipe). */
export function temporaryPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const pick = (set: string, n: number) => Array.from(randomBytes(n), (b) => set[b % set.length]).join("");
  const digits = Array.from(randomBytes(4), (b) => String(b % 10)).join("");
  return `${pick(letters, 2)}${pick(lower, 4)}-${digits}!`;
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(customerId: string, device?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const session = await prisma.customerSession.create({
    data: {
      tokenHash: tokenHash(token),
      customerId,
      device: device?.slice(0, 120) || null,
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
    },
  });
  await prisma.customer.update({ where: { id: customerId }, data: { lastLoginAt: new Date() } });
  return { token, session };
}

function bearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

/** La requête porte-t-elle un jeton client (valide ou non) ? */
export function hasBearer(request: Request): boolean {
  return bearer(request) !== null;
}

export type AuthedCustomer = { customer: Customer; session: CustomerSession };

/** Client connecté (jeton valide, non expiré, non révoqué, compte actif) ou null. */
export async function getCustomer(request: Request): Promise<AuthedCustomer | null> {
  const token = bearer(request);
  if (!token) return null;
  const session = await prisma.customerSession.findUnique({ where: { tokenHash: tokenHash(token) }, include: { customer: true } });
  if (!session || session.revokedAt || session.expiresAt.getTime() < Date.now()) return null;
  if (session.customer.status !== "active") return null;
  // Mise à jour de "dernière activité" au plus une fois par 5 minutes.
  if (Date.now() - session.lastUsedAt.getTime() > 5 * 60_000) {
    await prisma.customerSession.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  }
  const { customer, ...rest } = session;
  return { customer, session: rest };
}

export async function requireCustomer(request: Request): Promise<AuthedCustomer | NextResponse> {
  const authed = await getCustomer(request);
  if (!authed) return NextResponse.json({ ok: false, code: "unauthorized", error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  return authed;
}

/** Données du compte renvoyées à l'appli (sans mot de passe ni note interne). */
export function publicCustomer(c: Customer) {
  return {
    id: c.id,
    email: c.email,
    phone: c.phone,
    firstName: c.firstName,
    lastName: c.lastName,
    country: c.country,
    region: c.region,
    birthDate: c.birthDate,
    occupation: c.occupation,
    jobTitle: c.jobTitle,
    address: c.address,
    marketing: c.marketing,
    kyc: c.kycStatus,
    kycDocument: c.kycDocument,
    kycNote: c.kycStatus === "rejected" ? c.kycNote : null,
    kycVerifiedAt: c.kycStatus === "verified" ? c.kycReviewedAt?.toISOString() ?? null : null,
    mustChangePassword: c.mustChangePassword,
    passwordChangedAt: c.passwordChangedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

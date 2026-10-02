import { NextResponse } from "next/server";

/**
 * Authentification de l'administration (/admin/**, /api/admin/**, actions opérateur).
 *
 * - ADMIN_PASSWORD : mot de passe unique de l'équipe (page /admin/login).
 * - ADMIN_SESSION_SECRET : secret HMAC du cookie de session (à défaut, dérivé de ADMIN_PASSWORD :
 *   changer le mot de passe déconnecte alors toutes les sessions).
 * - ADMIN_API_TOKEN : jeton opérateur historique, accepté en `Authorization: Bearer …` sur les API.
 *
 * Sans ADMIN_PASSWORD, l'admin reste fermé (message « configurez ADMIN_PASSWORD »), sauf en
 * NODE_ENV=development où il reste ouvert avec un bandeau d'avertissement.
 *
 * Uniquement Web Crypto : utilisable dans le middleware (Edge) comme dans les routes (Node).
 */

export const ADMIN_COOKIE = "pw_admin_session";
export const ADMIN_SESSION_HOURS = 12;
const SESSION_MS = ADMIN_SESSION_HOURS * 60 * 60 * 1000;

export type AdminMode = "configured" | "dev-open" | "locked";

export function adminMode(): AdminMode {
  if (process.env.ADMIN_PASSWORD) return "configured";
  return process.env.NODE_ENV === "development" ? "dev-open" : "locked";
}

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Comparaison à temps constant (longueurs différentes → false). */
export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;
  const password = process.env.ADMIN_PASSWORD;
  return password ? `pw-admin-derived:${password}` : null;
}

async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

/** Jeton "v1.<expiration ms>.<hmac>" ; null si l'admin n'est pas configuré. */
export async function createSessionToken(now = Date.now()): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload = `v1.${now + SESSION_MS}`;
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifySessionToken(token: string | null | undefined, now = Date.now()): Promise<boolean> {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= now || exp > now + SESSION_MS + 60_000) return false;
  return safeEqual(parts[2], await sign(`${parts[0]}.${parts[1]}`, secret));
}

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && safeEqual(input, expected);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_HOURS * 60 * 60,
  };
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Jeton opérateur ADMIN_API_TOKEN en `Authorization: Bearer …` (ou `x-admin-token`). */
export function hasValidApiToken(request: Request): boolean {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7).trim() : (request.headers.get("x-admin-token") ?? "");
  return given !== "" && safeEqual(given, expected);
}

/** Session admin valide (cookie signé), jeton opérateur, ou mode développement ouvert. */
export async function isAdminRequest(request: Request): Promise<boolean> {
  if (hasValidApiToken(request)) return true;
  const mode = adminMode();
  if (mode === "dev-open") return true;
  if (mode === "locked") return false;
  return verifySessionToken(readCookie(request.headers.get("cookie"), ADMIN_COOKIE));
}

/**
 * À appeler en tête de chaque route API admin : null si autorisé, sinon la réponse d'erreur
 * (401 non authentifié, 503 admin non configuré).
 */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  if (await isAdminRequest(request)) return null;
  if (adminMode() === "locked" && !process.env.ADMIN_API_TOKEN) {
    return NextResponse.json(
      { ok: false, code: "admin_not_configured", error: "Administration fermée : définissez ADMIN_PASSWORD" },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: "unauthorized", error: "Authentification administrateur requise" }, { status: 401 });
}

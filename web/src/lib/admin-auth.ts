/**
 * Authentification de l'administration (/admin/**, /api/admin/**, actions opérateur) — partie
 * utilisable dans le middleware (Edge) : signature du cookie, mot de passe, jeton opérateur.
 * La vérification complète (session non révoquée, origine, journal d'audit) est dans admin-guard.ts.
 *
 * - ADMIN_PASSWORD : mot de passe de l'équipe (page /admin/login), ADMIN_USERNAME facultatif.
 * - ADMIN_SESSION_SECRET : secret HMAC du cookie de session. OBLIGATOIRE en production (sans lui,
 *   l'admin reste fermé) ; en développement local seulement, il est dérivé de ADMIN_PASSWORD.
 * - ADMIN_TOTP_SECRET : facultatif, active le code à 6 chiffres (application d'authentification).
 * - ADMIN_API_TOKEN : jeton opérateur, accepté en `Authorization: Bearer …` sur les API.
 *
 * Uniquement Web Crypto : utilisable dans le middleware (Edge) comme dans les routes (Node).
 */

export const ADMIN_COOKIE = "pw_admin_session";
export const ADMIN_SESSION_HOURS = 12;
const SESSION_MS = ADMIN_SESSION_HOURS * 60 * 60 * 1000;

export type AdminMode = "configured" | "dev-open" | "locked";

export function adminMode(): AdminMode {
  if (process.env.ADMIN_PASSWORD && sessionSecret()) return "configured";
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
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (secret) return secret;
  // Jamais de secret dérivé du mot de passe en production.
  if (process.env.NODE_ENV === "production") return null;
  const password = process.env.ADMIN_PASSWORD;
  return password ? `pw-admin-derived:${password}` : null;
}

/** Longueur minimale conseillée du mot de passe admin (affichée en alerte si plus court). */
export const ADMIN_PASSWORD_MIN_LENGTH = 14;

export function adminPasswordTooShort(): boolean {
  return (process.env.ADMIN_PASSWORD ?? "").length < ADMIN_PASSWORD_MIN_LENGTH;
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

export type SessionClaims = { sid: string; exp: number };

function newSessionId(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return base64url(bytes.buffer);
}

/** Jeton "v2.<id de session>.<expiration ms>.<hmac>" ; null si l'admin n'est pas configuré. */
export async function createSessionToken(now = Date.now()): Promise<{ token: string; sid: string; exp: number } | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const sid = newSessionId();
  const exp = now + SESSION_MS;
  const payload = `v2.${sid}.${exp}`;
  return { token: `${payload}.${await sign(payload, secret)}`, sid, exp };
}

/** Signature et expiration seulement (Edge). La révocation est vérifiée côté serveur (admin-guard.ts). */
export async function readSessionToken(token: string | null | undefined, now = Date.now()): Promise<SessionClaims | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v2" || !/^[A-Za-z0-9_-]{16,64}$/.test(parts[1])) return null;
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp) || exp <= now || exp > now + SESSION_MS + 60_000) return null;
  const ok = safeEqual(parts[3], await sign(`${parts[0]}.${parts[1]}.${parts[2]}`, secret));
  return ok ? { sid: parts[1], exp } : null;
}

export async function verifySessionToken(token: string | null | undefined, now = Date.now()): Promise<boolean> {
  return (await readSessionToken(token, now)) !== null;
}

/** Identifiant de connexion facultatif (ADMIN_USERNAME) : s'il est défini, il est exigé avec le mot de passe. */
export function adminUsernameRequired(): boolean {
  return Boolean(process.env.ADMIN_USERNAME?.trim());
}

export function checkAdminPassword(input: string, username = ""): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  const expectedUser = process.env.ADMIN_USERNAME?.trim();
  // Les deux comparaisons sont toujours faites (temps constant, pas d'indice sur ce qui est faux).
  const userOk = expectedUser ? safeEqual(username.trim().toLowerCase(), expectedUser.toLowerCase()) : true;
  const passOk = !!expected && safeEqual(input, expected);
  return userOk && passOk;
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

export function readCookie(header: string | null, name: string): string | null {
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

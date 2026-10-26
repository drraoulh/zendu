import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Double authentification de l'admin : code à 6 chiffres d'une application d'authentification
 * (Google Authenticator, Microsoft Authenticator, 1Password…), norme TOTP (RFC 6238, SHA-1, 30 s).
 * Activée seulement si ADMIN_TOTP_SECRET (base32) est défini. Générer le secret :
 *   node scripts/admin-totp-setup.mjs
 */

export function adminTotpEnabled(): boolean {
  return Boolean(process.env.ADMIN_TOTP_SECRET?.trim());
}

function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) throw new Error("ADMIN_TOTP_SECRET invalide (base32 attendu)");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(key: Buffer, counter: number): string {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac("sha1", key).update(msg).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const code = (mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

/**
 * Pas de temps (30 s) du code accepté, ou null. Tolère ±1 pas (décalage d'horloge du téléphone).
 * L'appelant refuse un pas déjà utilisé (pas de rejeu du même code).
 */
export function verifyAdminTotp(code: string, now = Date.now()): number | null {
  return verifyTotp(process.env.ADMIN_TOTP_SECRET?.trim() ?? "", code, now);
}

/** Même vérification avec le secret d'un compte (base32). */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
  const given = code.replace(/\s/g, "");
  if (!secret || !/^\d{6}$/.test(given)) return null;
  const key = base32Decode(secret);
  const step = Math.floor(now / 30_000);
  let match: number | null = null;
  for (const s of [step - 1, step, step + 1]) {
    // Toutes les comparaisons sont faites (temps constant).
    if (timingSafeEqual(Buffer.from(hotp(key, s)), Buffer.from(given)) && match === null) match = s;
  }
  return match;
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Nouveau secret base32 (160 bits) pour une application d'authentification. */
export function newTotpSecret(): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of randomBytes(20)) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function totpUri(secret: string, account: string): string {
  const issuer = "WorldSoft Transfer";
  return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&period=30&digits=6`;
}

function secretKey(): Buffer {
  const base = process.env.ADMIN_SESSION_SECRET?.trim() || (process.env.NODE_ENV === "production" ? "" : `dev:${process.env.ADMIN_PASSWORD ?? ""}`);
  if (!base) throw new Error("ADMIN_SESSION_SECRET manquant");
  return createHash("sha256").update(`admin-totp-key:${base}`).digest();
}

/**
 * Chiffre un secret (AES-256-GCM, clé dérivée de ADMIN_SESSION_SECRET) : "v1.<iv>.<tag>.<données>".
 * Changer ADMIN_SESSION_SECRET rend les codes à 6 chiffres enregistrés illisibles : il faut alors les réactiver.
 */
export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", secretKey(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

export function openSecret(sealed: string): string | null {
  try {
    const [v, iv, tag, data] = sealed.split(".");
    if (v !== "v1" || !iv || !tag || !data) return null;
    const d = createDecipheriv("aes-256-gcm", secretKey(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

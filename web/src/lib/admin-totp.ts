import { createHmac, timingSafeEqual } from "node:crypto";

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
  const secret = process.env.ADMIN_TOTP_SECRET?.trim();
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

// Génère un secret pour la double authentification de l'admin (ADMIN_TOTP_SECRET).
// Usage : node scripts/admin-totp-setup.mjs
// 1. Ajoutez la clé affichée dans votre application d'authentification (saisie manuelle, ou lien otpauth).
// 2. Mettez la même valeur dans Vercel : ADMIN_TOTP_SECRET (Production), puis redéployez.
// Ne collez jamais ce secret dans un chat, un courriel ou le code.
import { randomBytes } from "node:crypto";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const bytes = randomBytes(20);
let bits = 0;
let value = 0;
let secret = "";
for (const b of bytes) {
  value = (value << 8) | b;
  bits += 8;
  while (bits >= 5) {
    secret += alphabet[(value >>> (bits - 5)) & 31];
    bits -= 5;
  }
}
if (bits > 0) secret += alphabet[(value << (5 - bits)) & 31];

const label = encodeURIComponent("WorldSoft Transfer:admin");
console.log("ADMIN_TOTP_SECRET=" + secret);
console.log("otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + encodeURIComponent("WorldSoft Transfer") + "&period=30&digits=6");

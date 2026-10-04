import { phone } from "./format";
import type { Recipient } from "./store";

export function recipientDetail(r: Recipient) {
  if (r.network === "BANK") return `${r.bankName ?? "Banque"} •••• ${(r.accountNumber ?? "").slice(-4)}`;
  return r.phone ? phone(r.phone) : "";
}

/** Corridor à utiliser pour envoyer à ce destinataire depuis le pays du client. */
export function corridorFor(home: string, r: Recipient) {
  if (home !== r.country) return `${home}-${r.country}`;
  return r.country === "CA" ? "CM-CA" : `CA-${r.country}`;
}

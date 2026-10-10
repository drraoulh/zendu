import { NextResponse } from "next/server";
import type { Beneficiary, Transfer, TransferEvent } from "@prisma/client";
import { isAdminRequest } from "@/lib/admin-auth";
import { getCustomer, hasBearer } from "@/lib/customer-auth";

/**
 * Qui peut lire / agir sur un transfert identifié par son id (GET, reçu, simulate-pay) ?
 *
 * - "full"   : l'équipe (session admin, ADMIN_API_TOKEN) ou le client propriétaire (Bearer).
 * - "public" : envoi sans compte depuis le site (customerId null) — le lien de suivi fait office
 *              d'accès, mais seules des données minimales et masquées sont renvoyées.
 * - sinon    : transfert d'un client consulté par un tiers → 404 (on ne confirme pas son existence) ;
 *              jeton expiré / révoqué → 401.
 */
export type TransferAccess = "full" | "public";

export async function transferAccess(
  request: Request,
  transfer: Pick<Transfer, "customerId">,
): Promise<TransferAccess | NextResponse> {
  if (await isAdminRequest(request)) return "full";
  const authed = await getCustomer(request);
  if (!authed && hasBearer(request)) {
    return NextResponse.json({ ok: false, code: "unauthorized", error: "Session expirée. Reconnectez-vous." }, { status: 401 });
  }
  if (authed && transfer.customerId === authed.customer.id) return "full";
  if (transfer.customerId === null) return "public";
  return notFound();
}

export function notFound() {
  return NextResponse.json({ error: "Introuvable" }, { status: 404 });
}

/** « Jean D. » */
export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ? `${parts[0].slice(0, 1)}.` : "";
  return `${parts[0]} ${parts.slice(1).map((p) => `${p.slice(0, 1).toUpperCase()}.`).join(" ")}`;
}

/** « •••• 42 » */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits ? `•••• ${digits.slice(-2)}` : "";
}

/** « j•••@exemple.com » */
export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.split("@");
  return domain ? `${user.slice(0, 1)}•••@${domain}` : "";
}

/** Numéros (téléphone, compte) masqués dans les textes libres des événements. */
function maskNumbers(text: string | null): string | null {
  return text ? text.replace(/\+?\d[\d\s.-]{6,}\d/g, (m) => (m.replace(/\D/g, "").length >= 8 ? maskPhone(m) : m)) : text;
}

/**
 * Vue publique d'un transfert (suivi par lien) : statut, montants et étapes, sans courriel, téléphone,
 * numéro de compte ni références techniques ; noms réduits à « Prénom I. ».
 */
export function publicTransferView(transfer: Transfer & { beneficiary: Beneficiary; events?: TransferEvent[] }) {
  const b = transfer.beneficiary;
  return {
    id: transfer.id,
    reference: transfer.reference,
    status: transfer.status,
    corridorId: transfer.corridorId,
    sourceCountry: transfer.sourceCountry,
    destCountry: transfer.destCountry,
    sendCurrency: transfer.sendCurrency,
    receiveCurrency: transfer.receiveCurrency,
    senderName: maskName(transfer.senderName),
    sendAmountCad: transfer.sendAmountCad,
    receiveAmountXaf: transfer.receiveAmountXaf,
    rate: transfer.rate,
    feeCad: transfer.feeCad,
    totalCad: transfer.totalCad,
    payInProvider: transfer.payInProvider,
    payoutProvider: transfer.payoutProvider,
    payoutRef: null,
    failureReason: maskNumbers(transfer.failureReason),
    createdAt: transfer.createdAt,
    paidAt: transfer.paidAt,
    deliveredAt: transfer.deliveredAt,
    beneficiary: {
      fullName: maskName(b.fullName),
      phone: maskPhone(b.phone),
      network: b.network,
      country: b.country,
      bankName: b.bankName,
      accountMasked: b.accountNumber ? `•••• ${b.accountNumber.slice(-4)}` : null,
      bankCode: null,
    },
    events: transfer.events?.map((e) => ({ id: e.id, type: e.type, message: maskNumbers(e.message) ?? "", createdAt: e.createdAt })),
    limited: true,
  };
}

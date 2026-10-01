export const TRANSFER_STATUSES = [
  "draft",
  "quoted",
  "awaiting_payment",
  "payment_detected",
  "payout_queued",
  "payout_sent",
  "delivered",
  "payment_mismatch",
  "payout_failed",
  "expired",
  "cancelled",
] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

const ALLOWED: Record<TransferStatus, TransferStatus[]> = {
  draft: ["quoted", "cancelled"],
  quoted: ["awaiting_payment", "expired", "cancelled"],
  awaiting_payment: ["payment_detected", "expired", "cancelled", "payment_mismatch"],
  payment_detected: ["payout_queued", "cancelled"],
  payout_queued: ["payout_sent", "payout_failed"],
  payout_sent: ["delivered", "payout_failed"],
  delivered: [],
  payment_mismatch: ["awaiting_payment", "cancelled"],
  payout_failed: ["payout_queued", "cancelled"],
  expired: [],
  cancelled: [],
};

export function canTransition(from: TransferStatus, to: TransferStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: string, to: TransferStatus): void {
  if (!canTransition(from as TransferStatus, to)) {
    throw new Error(`Transition invalide: ${from} → ${to}`);
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Brouillon",
    quoted: "Devis",
    awaiting_payment: "En attente de paiement",
    payment_detected: "Paiement reçu",
    payout_queued: "Payout en file",
    payout_sent: "Versement en cours",
    delivered: "Livré",
    payment_mismatch: "Paiement non conforme",
    payout_failed: "Échec payout",
    expired: "Expiré",
    cancelled: "Annulé",
  };
  return labels[status] ?? status;
}

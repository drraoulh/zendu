import { TRANSFER_STATUSES, type TransferStatus } from "@/lib/transfer-machine";

export type StatusTone = "brand" | "success" | "warn" | "danger" | "neutral";
export type StatusGroup = "progress" | "delivered" | "issue";

const TONES: Record<TransferStatus, StatusTone> = {
  draft: "neutral",
  quoted: "neutral",
  awaiting_payment: "warn",
  payment_detected: "brand",
  payout_queued: "brand",
  payout_sent: "brand",
  delivered: "success",
  payment_mismatch: "danger",
  payout_failed: "danger",
  expired: "neutral",
  cancelled: "neutral",
};

export function isKnownStatus(status: string): status is TransferStatus {
  return (TRANSFER_STATUSES as readonly string[]).includes(status);
}

export function statusTone(status: string): StatusTone {
  return isKnownStatus(status) ? TONES[status] : "neutral";
}

export function statusGroup(status: string): StatusGroup {
  if (status === "delivered") return "delivered";
  if (["payment_mismatch", "payout_failed", "expired", "cancelled"].includes(status)) return "issue";
  return "progress";
}

export function isFailure(status: string): boolean {
  return ["payment_mismatch", "payout_failed", "cancelled", "expired"].includes(status);
}

/** Index de l'étape atteinte : 0 créé, 1 payé, 2 versement envoyé, 3 livré. */
export function progressIndex(status: string): number {
  switch (status) {
    case "delivered":
      return 3;
    case "payout_sent":
      return 2;
    case "payment_detected":
    case "payout_queued":
    case "payout_failed":
      return 1;
    default:
      return 0;
  }
}

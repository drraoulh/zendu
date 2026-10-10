/** Filtres de la liste des transferts (paramètres d'URL `q` et `status`). */
export const STATUS_GROUPS = {
  todo: ["awaiting_payment", "payment_mismatch", "payout_failed"],
  progress: ["payment_detected", "payout_queued", "payout_sent"],
  delivered: ["delivered"],
  closed: ["expired", "cancelled", "draft", "quoted"],
} as const satisfies Record<string, readonly string[]>;

export type StatusGroup = keyof typeof STATUS_GROUPS;

export type TransferFilters = { q?: string; status?: StatusGroup };

export function parseTransferFilters(sp: Record<string, string | string[] | undefined>): TransferFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  const q = one(sp.q)?.slice(0, 100);
  const status = one(sp.status);
  return { q, status: status && status in STATUS_GROUPS ? (status as StatusGroup) : undefined };
}

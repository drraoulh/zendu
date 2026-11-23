/**
 * Double validation des virements Interac : au-delà de INTERAC_DUAL_APPROVAL_CAD (1 000 par défaut),
 * deux personnes différentes de l'équipe doivent confirmer la réception avant que le versement parte.
 */
export function interacDualApprovalThreshold(): number {
  const n = Number(process.env.INTERAC_DUAL_APPROVAL_CAD);
  return process.env.INTERAC_DUAL_APPROVAL_CAD && Number.isFinite(n) && n > 0 ? n : 1000;
}

/** Seuil dans une autre devise que le CAD (encaissement manuel Cameroun / Chine) ; plus haut que les plafonds par défaut. */
function thresholdFor(currency: string): number {
  if (currency === "CAD") return interacDualApprovalThreshold();
  const defaults: Record<string, number> = { XAF: 450_000, CNY: 5_000 };
  const n = Number(process.env[`MANUAL_DUAL_APPROVAL_${currency}`]);
  return process.env[`MANUAL_DUAL_APPROVAL_${currency}`] && Number.isFinite(n) && n > 0 ? n : (defaults[currency] ?? interacDualApprovalThreshold());
}

export function needsDualApproval(total: number, currency = "CAD"): boolean {
  return total >= thresholdFor(currency);
}

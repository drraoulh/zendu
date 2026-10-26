/**
 * Double validation des virements Interac : au-delà de INTERAC_DUAL_APPROVAL_CAD (1 000 par défaut),
 * deux personnes différentes de l'équipe doivent confirmer la réception avant que le versement parte.
 */
export function interacDualApprovalThreshold(): number {
  const n = Number(process.env.INTERAC_DUAL_APPROVAL_CAD);
  return process.env.INTERAC_DUAL_APPROVAL_CAD && Number.isFinite(n) && n > 0 ? n : 1000;
}

export function needsDualApproval(totalCad: number): boolean {
  return totalCad >= interacDualApprovalThreshold();
}

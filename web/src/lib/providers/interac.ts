/**
 * Encaissement par virement Interac (Canada, CAD) — mode « dépôt automatique » :
 * le client envoie un virement Interac depuis son appli bancaire à l'adresse de dépôt de PWFINTECH
 * (INTERAC_DEPOSIT_EMAIL, compte d'entreprise avec dépôt automatique), en indiquant la référence du
 * transfert dans le message. L'équipe confirme la réception dans /admin/transferts, ce qui lance le
 * versement. Étape suivante prévue : demande d'argent Interac via un prestataire (Zūm Rails, VoPay)
 * pour une confirmation automatique.
 */
export const INTERAC_PROVIDER = "interac_manual";

/** Délai laissé au client pour envoyer le virement avant que le transfert soit considéré expiré. */
export const INTERAC_PAYMENT_HOURS = 24;

export function interacDepositEmail(): string | null {
  return process.env.INTERAC_DEPOSIT_EMAIL?.trim() || null;
}

/**
 * Simulation de la réception (démo) : seulement tant qu'aucune vraie adresse de dépôt n'est configurée,
 * pour qu'un transfert réel ne puisse jamais être marqué payé sans contrôle de l'équipe.
 */
export function interacSimulationAllowed(): boolean {
  return interacDepositEmail() === null;
}

export type InteracInstructions = {
  /** Adresse à laquelle envoyer le virement (null tant qu'elle n'est pas configurée). */
  email: string | null;
  amount: number;
  currency: "CAD";
  /** À recopier dans le message du virement : c'est ce qui permet de rapprocher le paiement. */
  message: string;
  expiresAt: string;
  simulate: boolean;
};

export function interacInstructions(t: { reference: string; totalCad: number; createdAt: Date }): InteracInstructions {
  return {
    email: interacDepositEmail(),
    amount: Math.round(t.totalCad * 100) / 100,
    currency: "CAD",
    message: t.reference,
    expiresAt: new Date(t.createdAt.getTime() + INTERAC_PAYMENT_HOURS * 3600_000).toISOString(),
    simulate: interacSimulationAllowed(),
  };
}

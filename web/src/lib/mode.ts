/**
 * Mode de fonctionnement : démonstration ou réel.
 *
 * Mode réel dès que APP_MODE="live" OU qu'une adresse de dépôt Interac est configurée
 * (INTERAC_DEPOSIT_EMAIL) : à partir de là, plus aucune simulation n'est possible —
 * ni paiement « simulé », ni versement « simulé ». Un transfert n'est marqué payé que par l'équipe
 * (Interac) et livré que par MTN ou par l'équipe (versement manuel).
 */
export function isLiveMode(): boolean {
  return process.env.APP_MODE?.trim() === "live" || Boolean(process.env.INTERAC_DEPOSIT_EMAIL?.trim());
}

export type PayMethod = "interac" | "card";

/**
 * Moyens de paiement réellement disponibles selon le pays d'envoi.
 * - Canada : virement Interac (+ carte en démo seulement).
 * - Autres pays : carte en démo seulement. En mode réel, aucun moyen d'encaissement n'est encore
 *   branché (MTN / Orange collecte à venir) : ces trajets sont donc fermés à l'envoi.
 * La carte n'a pas encore de prestataire réel : elle reste une simulation.
 */
export function payMethodsFor(sourceCountry: string): PayMethod[] {
  const live = isLiveMode();
  const methods: PayMethod[] = [];
  if (sourceCountry === "CA") methods.push("interac");
  if (!live) methods.push("card");
  return methods;
}

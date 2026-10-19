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
  // En réel, Interac exige une adresse de dépôt (sinon le client ne saurait pas où payer).
  if (sourceCountry === "CA" && (!live || process.env.INTERAC_DEPOSIT_EMAIL?.trim())) methods.push("interac");
  if (!live) methods.push("card");
  return methods;
}

function envNumber(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return process.env[name] && Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Plafonds de sécurité (mode réel) :
 * - par client sur 24 h et 30 jours, en dollars canadiens (envois payés en CAD) ;
 * - par versement Mobile Money, en FCFA (limites des portefeuilles MTN / Orange).
 * Réglables : TRANSFER_DAILY_LIMIT_CAD (3 000), TRANSFER_MONTHLY_LIMIT_CAD (10 000),
 * MOBILE_MONEY_MAX_XAF (500 000).
 */
export function transferLimits() {
  return {
    dailyCad: envNumber("TRANSFER_DAILY_LIMIT_CAD", 3000),
    monthlyCad: envNumber("TRANSFER_MONTHLY_LIMIT_CAD", 10000),
    mobileMoneyMaxXaf: envNumber("MOBILE_MONEY_MAX_XAF", 500000),
  };
}

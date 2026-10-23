/**
 * Mode de fonctionnement : démonstration ou réel. ÉCHOUE FERMÉ : par défaut, un serveur de
 * production est en mode réel, même si une variable d'environnement manque.
 *
 * - Mode réel : APP_MODE="live", OU une adresse de dépôt Interac (INTERAC_DEPOSIT_EMAIL), OU le
 *   déploiement de production Vercel (VERCEL_ENV="production" : jamais de démo sur le site public),
 *   OU tout serveur NODE_ENV="production" sans APP_MODE="demo" explicite.
 * - Démo : seulement en développement local, ou sur un déploiement de prévisualisation qui pose
 *   APP_MODE="demo" explicitement.
 * En mode réel, plus aucune simulation n'est possible — ni paiement « simulé », ni versement
 * « simulé », ni code de connexion affiché, ni identité validée automatiquement.
 */
export function isLiveMode(): boolean {
  const mode = process.env.APP_MODE?.trim();
  if (mode === "live" || process.env.INTERAC_DEPOSIT_EMAIL?.trim()) return true;
  if (process.env.VERCEL_ENV === "production") return true;
  if (mode === "demo") return false;
  return process.env.NODE_ENV === "production";
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

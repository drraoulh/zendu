/**
 * Encaissement MANUEL depuis le Cameroun (XAF) ou la Chine (CNY).
 *
 * Le client envoie lui-même l'argent au compte de l'entreprise (MTN MoMo / Orange Money au Cameroun,
 * WeChat / Alipay / banque en Chine), avec la référence du transfert en message. L'équipe vérifie la
 * réception et la confirme dans l'admin, ce qui lance le versement — même circuit que le virement Interac.
 *
 * ÉTEINT PAR DÉFAUT. Ouverture, pays par pays, seulement si les deux variables existent :
 *   MANUAL_PAYIN_COUNTRIES="CM,CN"            pays ouverts
 *   MANUAL_PAYIN_CM="MTN MoMo|6 70 00 00 00|Paul World Finances"   méthode | ligne | ligne…
 *   MANUAL_PAYIN_CN="WeChat Pay|ID wechat|Nom du compte"
 * Plafonds : MANUAL_PAYIN_MAX_XAF (150 000) et MANUAL_PAYIN_MAX_CNY (1 500) par envoi ; au plus 3 fois ce
 * montant sur 24 h par client.
 * À n'ouvrir qu'après avis de l'avocat (BEAC pour le Cameroun, SAFE / PBOC pour la Chine).
 */
export const MANUAL_PAYIN_PROVIDER = "manual_payin";

/** Délai laissé au client pour envoyer l'argent. */
export const MANUAL_PAYIN_HOURS = 24;

export function isManualPayIn(provider: string | null | undefined): boolean {
  return provider === MANUAL_PAYIN_PROVIDER;
}

function enabledCountries(): string[] {
  return (process.env.MANUAL_PAYIN_COUNTRIES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

function parseAccount(country: string): { method: string; lines: string[] } | null {
  const raw = process.env[`MANUAL_PAYIN_${country}`]?.trim();
  if (!raw) return null;
  const parts = raw.split("|").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  return { method: parts[0], lines: parts.slice(1) };
}

/** Le pays d'envoi accepte-t-il l'encaissement manuel ? En réel (`live`) : coordonnées obligatoires. */
export function manualPayInOpen(sourceCountry: string, live: boolean): boolean {
  if (!enabledCountries().includes(sourceCountry)) return false;
  if (sourceCountry !== "CM" && sourceCountry !== "CN") return false;
  return live ? parseAccount(sourceCountry) !== null : true;
}

/** Plafond par envoi, dans la devise d'envoi (null : pas de plafond propre à cette devise). */
export function manualPayInMax(currency: string): number | null {
  const defaults: Record<string, number> = { XAF: 150_000, CNY: 1_500 };
  const base = defaults[currency];
  if (!base) return null;
  const n = Number(process.env[`MANUAL_PAYIN_MAX_${currency}`]);
  return process.env[`MANUAL_PAYIN_MAX_${currency}`] && Number.isFinite(n) && n > 0 ? n : base;
}

export type ManualPayInInstructions = {
  country: string;
  /** Moyen à utiliser : « MTN MoMo », « WeChat Pay »… */
  method: string;
  /** Numéro, identifiant et nom du compte qui reçoit, une information par ligne. */
  lines: string[];
  amount: number;
  currency: string;
  /** À recopier dans le message du paiement. */
  message: string;
  expiresAt: string;
  simulate: boolean;
};

export function manualPayInInstructions(
  t: {
  reference: string;
  totalCad: number;
  sendCurrency: string;
  sourceCountry: string;
  createdAt: Date;
  },
  simulate: boolean,
): ManualPayInInstructions {
  const account = parseAccount(t.sourceCountry);
  return {
    country: t.sourceCountry,
    method: account?.method ?? "",
    lines: account?.lines ?? [],
    amount: Math.round(t.totalCad * 100) / 100,
    currency: t.sendCurrency,
    message: t.reference,
    expiresAt: new Date(t.createdAt.getTime() + MANUAL_PAYIN_HOURS * 3600_000).toISOString(),
    simulate,
  };
}

import { roundMoney } from "./money";

/**
 * Tarifs par trajet, alignés sur le marché (vérifié en octobre 2026) :
 * - vers le Cameroun : AUCUN frais, comme Taptap Send et LemFi ; la rémunération est la marge de change ;
 * - vers la Chine : petit frais fixe, comme Remitly (1,49 $ depuis le Canada) — le versement sur
 *   WeChat Pay / Alipay coûte plus cher (partenaires agréés) et tous les concurrents facturent ce trajet ;
 * - vers le Canada : petit frais fixe pour couvrir le virement Interac ou bancaire au bénéficiaire.
 * Le retrait en espèces n'est pas proposé.
 *
 * Réglages (variables d'environnement, facultatives) :
 * - FX_MARGIN_PERCENT : marge par défaut sur le taux moyen (1,5 %).
 * - CORRIDOR_PRICING : JSON par trajet pour remplacer ces valeurs, ex.
 *   {"CA-CN":{"feeFlat":0.99},"CA-CM":{"marginPercent":1.8},"CM-CA":{"feeFlat":0,"feePercent":0.5}}
 *   (feeFlat dans la devise d'envoi, feePercent en % du montant envoyé, marginPercent en %).
 */
export type Pricing = {
  feeFlat: number;
  feePercent: number;
  marginPercent: number;
};

/** Frais fixes par défaut, dans la devise d'envoi (0 = « Gratuit »). */
const DEFAULT_FEE_FLAT: Record<string, number> = {
  "CA-CM": 0,
  "CN-CM": 0,
  "CA-CN": 1.49,
  "CM-CN": 1000,
  "CM-CA": 1000,
  "CN-CA": 10,
};

function num(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return raw !== undefined && raw !== null && raw !== "" && Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function defaultMarginPercent(): number {
  return num(process.env.FX_MARGIN_PERCENT, 1.5);
}

function corridorOverrides(): Record<string, Partial<Pricing>> {
  try {
    const parsed = JSON.parse(process.env.CORRIDOR_PRICING || "{}") as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, Partial<Pricing>>) : {};
  } catch {
    console.error("[pricing] CORRIDOR_PRICING n'est pas un JSON valide : ignoré");
    return {};
  }
}

/** Tarif d'un trajet (le mode de réception ne change pas le prix). */
export function pricingFor(corridorId: string): Pricing {
  const o = corridorOverrides()[corridorId] ?? {};
  return {
    feeFlat: num(o.feeFlat, DEFAULT_FEE_FLAT[corridorId] ?? 0),
    feePercent: num(o.feePercent, 0),
    marginPercent: num(o.marginPercent, defaultMarginPercent()),
  };
}

export function computeFee(sendAmount: number, currency: string, p: Pricing) {
  const variable = roundMoney((sendAmount * p.feePercent) / 100, currency);
  return { flat: p.feeFlat, variable, percent: p.feePercent, total: roundMoney(p.feeFlat + variable, currency) };
}

/** Taux client = taux moyen moins la marge, sur 6 chiffres significatifs (XAF→CAD ≈ 0,0024). */
export function customerRate(midRate: number, marginPercent: number): number {
  return Number((midRate * (1 - marginPercent / 100)).toPrecision(6));
}

import { roundMoney } from "./money";

/**
 * Tarification « sans frais », comme Taptap Send : aucun frais affiché sur les envois vers mobile money,
 * portefeuille (Alipay, WeChat Pay, Interac) ou compte bancaire ; la rémunération est la marge sur le
 * taux de change (FX_MARGIN_PERCENT, ajustable par trajet). Seul le retrait en espèces a des frais fixes.
 *
 * Réglages (variables d'environnement, toutes facultatives) :
 * - FX_MARGIN_PERCENT : marge par défaut sur le taux moyen (1,5 %).
 * - FEE_CASH_CAD / FEE_CASH_XAF / FEE_CASH_CNY : frais du retrait en espèces, dans la devise d'envoi.
 * - CORRIDOR_PRICING : JSON par trajet, ex. {"CA-CM":{"marginPercent":1.8},"CN-CM":{"feeFlat":5,"feePercent":0.5}}
 *   (feeFlat dans la devise d'envoi ; s'applique à tous les modes de réception du trajet, espèces en plus).
 */
export type Pricing = {
  feeFlat: number;
  feePercent: number;
  marginPercent: number;
};

const CASH_FEE_DEFAULT: Record<string, number> = { CAD: 2.99, XAF: 1500, CNY: 20 };

function num(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function defaultMarginPercent(): number {
  return num(process.env.FX_MARGIN_PERCENT ?? "1.5", 1.5);
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

function cashFee(currency: string): number {
  return num(process.env[`FEE_CASH_${currency}`], CASH_FEE_DEFAULT[currency] ?? 0);
}

/** Tarif d'un trajet, pour un mode de réception donné (sans mode : tarif le plus bas, « à partir de »). */
export function pricingFor(corridorId: string, sendCurrency: string, network?: string | null): Pricing {
  const o = corridorOverrides()[corridorId] ?? {};
  const base: Pricing = {
    feeFlat: num(o.feeFlat, 0),
    feePercent: num(o.feePercent, 0),
    marginPercent: num(o.marginPercent, defaultMarginPercent()),
  };
  if (network?.toUpperCase() === "CASH") base.feeFlat = roundMoney(base.feeFlat + cashFee(sendCurrency), sendCurrency);
  return base;
}

export function computeFee(sendAmount: number, currency: string, p: Pricing) {
  const variable = roundMoney((sendAmount * p.feePercent) / 100, currency);
  return { flat: p.feeFlat, variable, percent: p.feePercent, total: roundMoney(p.feeFlat + variable, currency) };
}

/** Taux client = taux moyen moins la marge, sur 6 chiffres significatifs (XAF→CAD ≈ 0,0024). */
export function customerRate(midRate: number, marginPercent: number): number {
  return Number((midRate * (1 - marginPercent / 100)).toPrecision(6));
}

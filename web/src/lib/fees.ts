import { roundMoney } from "./money";

/** Grille de frais type Remitly : fixe + % du montant envoyé. */
export function computeTransferFee(sendAmount: number, currency: string) {
  const percent = Number(process.env.FEE_PERCENT ?? "0.9"); // 0.9%
  const flatByCurrency: Record<string, number> = {
    CAD: Number(process.env.FEE_FLAT_CAD ?? "1.99"),
    USD: Number(process.env.FEE_FLAT_USD ?? "1.99"),
    EUR: Number(process.env.FEE_FLAT_EUR ?? "1.99"),
    GBP: Number(process.env.FEE_FLAT_GBP ?? "1.49"),
    CNY: Number(process.env.FEE_FLAT_CNY ?? "9.9"),
    AED: Number(process.env.FEE_FLAT_AED ?? "7.0"),
  };

  const flat = flatByCurrency[currency] ?? 1.99;
  const variable = roundMoney((sendAmount * percent) / 100, currency);
  const total = roundMoney(flat + variable, currency);

  return {
    flat,
    variable,
    percent,
    total,
  };
}

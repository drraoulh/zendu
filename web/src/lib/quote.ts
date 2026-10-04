import { roundMoney } from "./money";
import { getFxRate, type FxSnapshot } from "./fx";
import { getCorridor, getCountry } from "./corridors";
import { computeTransferFee } from "./fees";

export type QuoteInput = {
  corridorId?: string;
  sendAmount?: number;
  receiveAmount?: number;
};

export type QuoteResult = {
  corridorId: string;
  sourceCountry: string;
  destCountry: string;
  sendCurrency: string;
  receiveCurrency: string;
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  midRate: number;
  fee: number;
  feeFlat: number;
  feeVariable: number;
  feePercent: number;
  total: number;
  marginPercent: number;
  deliveryEstimate: string;
  expiresAt: Date;
  fx: FxSnapshot;
};

/** Montant hors limites du corridor (message anglais conservé : le simulateur web le reconnaît). */
export class QuoteLimitError extends Error {
  constructor(
    readonly code: "amount_too_low" | "amount_too_high",
    readonly limit: number,
    readonly currency: string,
  ) {
    super(`${code === "amount_too_low" ? "Minimum" : "Maximum"} amount is ${limit} ${currency}.`);
  }

  /** Message français pour les réponses affichées telles quelles (création de transfert). */
  get messageFr(): string {
    return `Montant ${this.code === "amount_too_low" ? "minimum" : "maximum"} : ${this.limit} ${this.currency}.`;
  }
}

export async function buildQuote(input: QuoteInput): Promise<QuoteResult> {
  const corridorId = input.corridorId ?? "CA-CM";
  const corridor = getCorridor(corridorId);
  if (!corridor) throw new Error("Unknown corridor");
  if (!corridor.active) {
    throw new Error("This corridor is not available yet.");
  }

  const source = getCountry(corridor.source);
  const dest = getCountry(corridor.destination);
  const fx = await getFxRate(source.currency, dest.currency);
  const rate = fx.customerRate;

  let send: number;
  let receive: number;

  if (
    input.receiveAmount != null &&
    Number.isFinite(input.receiveAmount) &&
    input.sendAmount == null
  ) {
    receive = roundMoney(input.receiveAmount, dest.currency);
    send = roundMoney(receive / rate, source.currency);
  } else {
    send = roundMoney(Number(input.sendAmount), source.currency);
    receive = roundMoney(send * rate, dest.currency);
  }

  if (!Number.isFinite(send) || send < corridor.minSend) {
    throw new QuoteLimitError("amount_too_low", corridor.minSend, source.currency);
  }
  if (send > corridor.maxSend) {
    throw new QuoteLimitError("amount_too_high", corridor.maxSend, source.currency);
  }

  const feeParts = computeTransferFee(send, source.currency);
  const fee =
    corridor.feeSend > 0
      ? roundMoney(corridor.feeSend, source.currency)
      : feeParts.total;

  const ttlMinutes = Number(process.env.QUOTE_TTL_MINUTES ?? "15");

  return {
    corridorId,
    sourceCountry: source.code,
    destCountry: dest.code,
    sendCurrency: source.currency,
    receiveCurrency: dest.currency,
    sendAmount: send,
    receiveAmount: receive,
    rate,
    midRate: fx.midRate,
    fee,
    feeFlat: feeParts.flat,
    feeVariable: feeParts.variable,
    feePercent: feeParts.percent,
    total: roundMoney(send + fee, source.currency),
    marginPercent: fx.marginPercent,
    deliveryEstimate: corridor.deliveryEstimate,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
    fx,
  };
}

/**
 * Données des corridors pour /frais, /pays et /pays/[code] — À UTILISER CÔTÉ SERVEUR.
 *
 * Les frais et montants reçus sont calculés avec `buildQuote` (les mêmes fonctions que
 * `/api/quotes`) : aucune valeur n'est recopiée à la main.
 */
import { BANK_DELIVERY_ESTIMATE, BANK_SUGGESTIONS, deliveryEstimateFor } from "@/lib/bank";
import {
  ACTIVE_COUNTRY_CODES,
  CORRIDORS,
  DEFAULT_CORRIDOR_ID,
  getCorridor,
  getCountry,
  type PayoutNetwork,
} from "@/lib/corridors";
import { buildQuote } from "@/lib/quote";
import { REGION_OF, type RegionId } from "./regions";

/** Montants d'exemple par devise d'envoi. */
export const SAMPLE_AMOUNTS: Record<string, number[]> = {
  CAD: [100, 500, 1000],
  XAF: [50000, 250000, 500000],
  CNY: [500, 2000, 5000],
};

export type SampleQuote = {
  sendAmount: number;
  fee: number;
  feeFlat: number;
  feeVariable: number;
  feePercent: number;
  total: number;
  receiveAmount: number;
  rate: number;
};

/** Un corridor « source → destination » avec ses frais calculés. */
export type DestinationInfo = {
  corridorId: string;
  sourceCode: string;
  sourceName: string;
  sendCurrency: string;
  code: string;
  name: string;
  region: RegionId;
  currency: string;
  networks: Array<PayoutNetwork & { delivery: string }>;
  deliveryEstimate: string;
  bankEstimate: string;
  minSend: number;
  maxSend: number;
  quotes: SampleQuote[];
  midRate: number | null;
  rate: number | null;
  marginPercent: number | null;
  fxSource: string | null;
  fxFetchedAt: string | null;
  fxStale: boolean;
  banks: string[];
};

export type CountryInfo = {
  code: string;
  name: string;
  currency: string;
  dialCode: string;
  networks: Array<PayoutNetwork & { delivery: string }>;
  banks: string[];
  /** Envois vers ce pays (depuis les autres pays ouverts). */
  inbound: DestinationInfo[];
  /** Envois depuis ce pays. */
  outbound: DestinationInfo[];
};

async function sampleQuote(corridorId: string, sendAmount: number) {
  try {
    const quote = await buildQuote({ corridorId, sendAmount });
    return {
      q: {
        sendAmount: quote.sendAmount,
        fee: quote.fee,
        feeFlat: quote.feeFlat,
        feeVariable: quote.feeVariable,
        feePercent: quote.feePercent,
        total: quote.total,
        receiveAmount: quote.receiveAmount,
        rate: quote.rate,
      } satisfies SampleQuote,
      fx: quote.fx,
      marginPercent: quote.marginPercent,
    };
  } catch {
    return null;
  }
}

export async function getCorridorInfo(corridorId: string): Promise<DestinationInfo | null> {
  const corridor = getCorridor(corridorId);
  if (!corridor || !corridor.active) return null;
  const source = getCountry(corridor.source);
  const dest = getCountry(corridor.destination);
  const amounts = SAMPLE_AMOUNTS[source.currency] ?? [corridor.minSend * 10];

  // Le premier appel réchauffe le cache de taux ; les suivants le réutilisent.
  const first = await sampleQuote(corridorId, amounts[0]);
  const rest = await Promise.all(amounts.slice(1).map((a) => sampleQuote(corridorId, a)));
  const results = [first, ...rest].filter((r): r is NonNullable<typeof r> => r !== null);
  const fx = results[results.length - 1]?.fx ?? null;

  return {
    corridorId,
    sourceCode: source.code,
    sourceName: source.name,
    sendCurrency: source.currency,
    code: dest.code,
    name: dest.name,
    region: REGION_OF[dest.code] ?? "other",
    currency: dest.currency,
    networks: dest.networks.map((n) => ({
      ...n,
      delivery: deliveryEstimateFor(corridor.deliveryEstimate, n.id, dest.code),
    })),
    deliveryEstimate: corridor.deliveryEstimate,
    bankEstimate: BANK_DELIVERY_ESTIMATE,
    minSend: corridor.minSend,
    maxSend: corridor.maxSend,
    quotes: results.map((r) => r.q),
    midRate: fx?.midRate ?? null,
    rate: fx?.customerRate ?? null,
    marginPercent: results[0]?.marginPercent ?? null,
    fxSource: fx?.source ?? null,
    fxFetchedAt: fx?.fetchedAt ?? null,
    fxStale: fx?.stale ?? true,
    banks: BANK_SUGGESTIONS[dest.code] ?? [],
  };
}

/** Tous les corridors ouverts, dans l'ordre des pays (CA, CM, CN…). */
export async function getAllCorridorInfos(): Promise<DestinationInfo[]> {
  const ids = CORRIDORS.filter((c) => c.active).map((c) => c.id);
  const all = await Promise.all(ids.map((id) => getCorridorInfo(id)));
  return all.filter((d): d is DestinationInfo => d !== null);
}

/** Codes des pays ouverts (pour generateStaticParams). */
export function countryCodes(): string[] {
  return [...ACTIVE_COUNTRY_CODES];
}

export async function getCountryInfo(code: string): Promise<CountryInfo | null> {
  const upper = code.toUpperCase();
  if (!ACTIVE_COUNTRY_CODES.includes(upper)) return null;
  const country = getCountry(upper);
  const all = await getAllCorridorInfos();
  const inbound = all.filter((d) => d.code === upper);
  const outbound = all.filter((d) => d.sourceCode === upper);
  const estimate = inbound[0]?.deliveryEstimate ?? "Under 24h";
  return {
    code: upper,
    name: country.name,
    currency: country.currency,
    dialCode: country.dialCode,
    networks: country.networks.map((n) => ({ ...n, delivery: deliveryEstimateFor(estimate, n.id, upper) })),
    banks: BANK_SUGGESTIONS[upper] ?? [],
    inbound,
    outbound,
  };
}

export type HelpNumbers = {
  sendCurrency: string;
  min: number;
  max: number;
  flat: number | null;
  percent: number | null;
  margin: number | null;
  ttl: number;
  countries: number;
};

/** Chiffres réels injectés dans les articles d'aide (corridor de référence Canada → Cameroun). */
export async function getHelpNumbers(): Promise<HelpNumbers> {
  const corridor = getCorridor(DEFAULT_CORRIDOR_ID) ?? CORRIDORS[0];
  const sample = corridor ? await sampleQuote(corridor.id, 100) : null;
  const ttl = Number(process.env.QUOTE_TTL_MINUTES ?? "15");
  return {
    sendCurrency: corridor ? getCountry(corridor.source).currency : "CAD",
    min: corridor?.minSend ?? 0,
    max: corridor?.maxSend ?? 0,
    flat: sample?.q.feeFlat ?? null,
    percent: sample?.q.feePercent ?? null,
    margin: sample?.marginPercent ?? null,
    ttl: Number.isFinite(ttl) ? ttl : 15,
    countries: ACTIVE_COUNTRY_CODES.length,
  };
}

/**
 * Données des destinations pour /frais, /pays et /pays/[code] — À UTILISER CÔTÉ SERVEUR.
 *
 * Les frais et montants reçus sont calculés avec `buildQuote` (les mêmes fonctions que
 * `/api/quotes`) : aucune valeur n'est recopiée à la main.
 */
import { BANK_DELIVERY_ESTIMATE, BANK_SUGGESTIONS, deliveryEstimateFor } from "@/lib/bank";
import { getCorridor, getCountry, getDestinationCountries, type PayoutNetwork } from "@/lib/corridors";
import { buildQuote } from "@/lib/quote";
import { REGION_OF, type RegionId } from "./regions";

export const SOURCE_COUNTRY = "CA";
export const SAMPLE_AMOUNTS = [100, 500, 1000] as const;

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

export type DestinationInfo = {
  code: string;
  name: string;
  region: RegionId;
  currency: string;
  sendCurrency: string;
  corridorId: string;
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

async function sampleQuote(corridorId: string, sendAmount: number): Promise<{ q: SampleQuote; fx: Awaited<ReturnType<typeof buildQuote>>["fx"]; marginPercent: number } | null> {
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
      },
      fx: quote.fx,
      marginPercent: quote.marginPercent,
    };
  } catch {
    return null;
  }
}

export async function getDestination(code: string): Promise<DestinationInfo | null> {
  const upper = code.toUpperCase();
  const corridorId = `${SOURCE_COUNTRY}-${upper}`;
  const corridor = getCorridor(corridorId);
  if (!corridor || !corridor.active) return null;
  const country = getCountry(upper);
  const source = getCountry(SOURCE_COUNTRY);

  // Le premier appel réchauffe le cache de taux ; les suivants le réutilisent.
  const first = await sampleQuote(corridorId, SAMPLE_AMOUNTS[0]);
  const rest = await Promise.all(SAMPLE_AMOUNTS.slice(1).map((a) => sampleQuote(corridorId, a)));
  const results = [first, ...rest].filter((r): r is NonNullable<typeof r> => r !== null);
  const fx = results[results.length - 1]?.fx ?? null;

  return {
    code: upper,
    name: country.name,
    region: REGION_OF[upper] ?? "other",
    currency: country.currency,
    sendCurrency: source.currency,
    corridorId,
    networks: country.networks.map((n) => ({
      ...n,
      delivery: deliveryEstimateFor(corridor.deliveryEstimate, n.id, upper),
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
    banks: BANK_SUGGESTIONS[upper] ?? [],
  };
}

export async function getAllDestinations(): Promise<DestinationInfo[]> {
  const codes = getDestinationCountries().map((c) => c.code);
  const all = await Promise.all(codes.map((code) => getDestination(code)));
  return all.filter((d): d is DestinationInfo => d !== null);
}

/** Codes des destinations actives depuis le Canada (pour generateStaticParams). */
export function destinationCodes(): string[] {
  return getDestinationCountries()
    .map((c) => c.code)
    .filter((code) => getCorridor(`${SOURCE_COUNTRY}-${code}`)?.active);
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

/** Chiffres réels injectés dans les articles d'aide (mêmes sources que /api/quotes). */
export async function getHelpNumbers(): Promise<HelpNumbers> {
  const codes = destinationCodes();
  const corridorId = `${SOURCE_COUNTRY}-${codes.includes("CM") ? "CM" : codes[0]}`;
  const corridor = getCorridor(corridorId);
  const sample = await sampleQuote(corridorId, 100);
  const ttl = Number(process.env.QUOTE_TTL_MINUTES ?? "15");
  return {
    sendCurrency: getCountry(SOURCE_COUNTRY).currency,
    min: corridor?.minSend ?? 0,
    max: corridor?.maxSend ?? 0,
    flat: sample?.q.feeFlat ?? null,
    percent: sample?.q.feePercent ?? null,
    margin: sample?.marginPercent ?? null,
    ttl: Number.isFinite(ttl) ? ttl : 15,
    countries: codes.length,
  };
}

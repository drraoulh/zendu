import { roundMoney } from "./money";

export type FxSnapshot = {
  pair: string;
  from: string;
  to: string;
  midRate: number;
  customerRate: number;
  marginPercent: number;
  source: string;
  fetchedAt: string;
  stale: boolean;
};

type CacheEntry = {
  key: string;
  midRate: number;
  source: string;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

const FALLBACKS: Record<string, number> = {
  "CAD-XAF": 410,
  "USD-XAF": 560,
  "EUR-XAF": 650,
  "GBP-XAF": 750,
  "CNY-XAF": 78,
  "AED-XAF": 152,
  "CAD-XOF": 410,
  "USD-XOF": 560,
  "EUR-XOF": 650,
  "GBP-XOF": 750,
  "CNY-XOF": 78,
  "AED-XOF": 152,
  "CAD-NGN": 1200,
  "USD-NGN": 1600,
  "EUR-NGN": 1750,
  "GBP-NGN": 2000,
  "CAD-GHS": 11,
  "USD-GHS": 15,
  "EUR-GHS": 16,
  "CAD-KES": 95,
  "USD-KES": 129,
  "EUR-KES": 140,
  "CAD-UGX": 2700,
  "USD-UGX": 3700,
  "CAD-TZS": 1900,
  "USD-TZS": 2600,
  "CAD-ZAR": 13,
  "USD-ZAR": 18,
  "EUR-ZAR": 19,
  "CAD-CDF": 2100,
  "USD-CDF": 2850,
  "CAD-RWF": 1000,
  "USD-RWF": 1350,
  "CAD-MAD": 7,
  "EUR-MAD": 10.5,
  "CAD-INR": 61,
  "USD-INR": 83,
  "CAD-PHP": 58,
  "USD-PHP": 58,
  "CAD-HTG": 97,
  "USD-HTG": 132,
};

function getMarginPercent(): number {
  const raw = Number(process.env.FX_MARGIN_PERCENT ?? "1.5");
  return Number.isFinite(raw) ? raw : 1.5;
}

function applyMargin(midRate: number, toCurrency: string): number {
  const margin = getMarginPercent();
  return roundMoney(midRate * (1 - margin / 100), toCurrency === "XAF" || toCurrency === "XOF" ? "CAD" : toCurrency);
}

function cacheKey(from: string, to: string) {
  return `${from}-${to}`.toUpperCase();
}

async function fetchLiveMidRate(
  from: string,
  to: string,
): Promise<{ midRate: number; source: string }> {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  const primary = async () => {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromLower}.json`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error(`FX primary HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, Record<string, number>>;
    const rate = data[fromLower]?.[toLower];
    if (!rate || !Number.isFinite(rate)) throw new Error(`${to} manquant`);
    return { midRate: rate, source: "currency-api" };
  };

  const secondary = async () => {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`FX secondary HTTP ${res.status}`);
    const data = (await res.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (!rate || !Number.isFinite(rate)) throw new Error(`${to} manquant`);
    return { midRate: rate, source: "open.er-api" };
  };

  try {
    return await primary();
  } catch {
    return await secondary();
  }
}

function snapshot(
  from: string,
  to: string,
  midRate: number,
  source: string,
  fetchedAt: number,
  stale: boolean,
): FxSnapshot {
  return {
    pair: `${from}/${to}`,
    from,
    to,
    midRate,
    customerRate: applyMargin(midRate, to),
    marginPercent: getMarginPercent(),
    source,
    fetchedAt: new Date(fetchedAt).toISOString(),
    stale,
  };
}

async function refreshLiveIntoCache(from: string, to: string, key: string) {
  const live = await fetchLiveMidRate(from, to);
  cache.set(key, {
    key,
    midRate: live.midRate,
    source: live.source,
    fetchedAt: Date.now(),
  });
  return live;
}

export async function getFxRate(
  from: string,
  to: string,
  forceRefresh = false,
): Promise<FxSnapshot> {
  const key = cacheKey(from, to);
  const now = Date.now();
  const hit = cache.get(key);

  if (!forceRefresh && hit && now - hit.fetchedAt < CACHE_TTL_MS) {
    return snapshot(from, to, hit.midRate, hit.source, hit.fetchedAt, false);
  }

  const fallbackMid =
    hit?.midRate ?? FALLBACKS[key] ?? Number(process.env.QUOTE_RATE ?? "410");
  const refresh = refreshLiveIntoCache(from, to, key).catch(() => null);

  if (!forceRefresh) {
    // Attend un peu le live ; sinon renvoie cache/fallback tout de suite
    // pour que le changement de pays soit immédiat.
    const quick = await Promise.race([
      refresh,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 60)),
    ]);
    if (quick) {
      return snapshot(from, to, quick.midRate, quick.source, Date.now(), false);
    }
    void refresh;
    return snapshot(
      from,
      to,
      fallbackMid,
      hit ? `${hit.source} (cache)` : "fallback",
      hit?.fetchedAt ?? now,
      true,
    );
  }

  const live = await refresh;
  if (live) {
    return snapshot(from, to, live.midRate, live.source, Date.now(), false);
  }
  return snapshot(
    from,
    to,
    fallbackMid,
    hit ? `${hit.source} (cache)` : "fallback",
    hit?.fetchedAt ?? now,
    true,
  );
}

/** @deprecated */
export async function getCadXafRate(forceRefresh = false) {
  return getFxRate("CAD", "XAF", forceRefresh);
}

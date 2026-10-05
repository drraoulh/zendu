"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { WstLogo } from "@/components/brand/wst-logo";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { calculatorMessages } from "@/i18n/calculator";
import { useT } from "@/i18n/define";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/* Helpers partagés (aussi utilisés par la page d'accueil)             */
/* ------------------------------------------------------------------ */

const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-CA",
  en: "en-CA",
  es: "es",
  zh: "zh-CN",
};

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale] ?? "fr-CA";
}

const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

/** Nom de pays traduit (Intl.DisplayNames), avec repli sur le nom anglais fourni. */
export function countryName(code: string, locale: Locale, fallback?: string): string {
  const tag = localeTag(locale);
  if (!displayNamesCache.has(tag)) {
    try {
      displayNamesCache.set(tag, new Intl.DisplayNames([tag], { type: "region" }));
    } catch {
      displayNamesCache.set(tag, null);
    }
  }
  const dn = displayNamesCache.get(tag);
  try {
    return dn?.of(code) ?? fallback ?? code;
  } catch {
    return fallback ?? code;
  }
}

/* ------------------------------------------------------------------ */
/* Types de l'API /api/quotes                                          */
/* ------------------------------------------------------------------ */

type CorridorMeta = {
  id: string;
  active: boolean;
  minSend: number;
  maxSend: number;
  deliveryEstimate: string;
  sourceCode: string;
  destCode: string;
  sourceName: string;
  destName: string;
  sendCurrency: string;
  receiveCurrency: string;
};

type Quote = {
  corridorId: string;
  sendAmount: number;
  receiveAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  rate: number;
  fee: number;
  feeFlat: number;
  feeVariable: number;
  feePercent: number;
  total: number;
  deliveryEstimate: string;
  fx?: { fetchedAt: string; stale: boolean };
};

type Mode = "send" | "receive";

const DEBOUNCE_MS = 450;
const REFRESH_MS = 30_000;

function parseAmount(text: string): number {
  const cleaned = text.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

function sanitizeInput(text: string): string {
  // Chiffres + un seul séparateur décimal.
  const s = text.replace(/[^\d.,]/g, "").replace(",", ".");
  const [int, ...rest] = s.split(".");
  return rest.length ? `${int}.${rest.join("").slice(0, 2)}` : int;
}

function formatRate(rate: number, tag: string): string {
  const digits = rate >= 100 ? 2 : rate >= 1 ? 4 : 6;
  return new Intl.NumberFormat(tag, { maximumFractionDigits: digits }).format(rate);
}

/* ------------------------------------------------------------------ */
/* Présélection d'un corridor (?corridor=CA-SN&amount=200 ou événement)  */
/* ------------------------------------------------------------------ */

const SELECT_EVENT = "pw:calculator-corridor";

type Preselect = { source?: string; dest?: string; amount?: number };

/** Montant proposé par défaut selon la devise d'envoi (au-dessus des minimums). */
const DEFAULT_AMOUNT: Record<string, number> = { CAD: 100, XAF: 100000, CNY: 1000 };

function parseCorridorParam(corridor: string | null, amount: string | null): Preselect {
  const out: Preselect = {};
  const m = corridor?.toUpperCase().match(/^([A-Z]{2})-([A-Z]{2})$/);
  if (m) {
    out.source = m[1];
    out.dest = m[2];
  }
  const n = amount ? Number(amount) : NaN;
  if (Number.isFinite(n) && n > 0) out.amount = n;
  return out;
}

/** Présélectionne un corridor dans les calculateurs déjà affichés sur la page. */
export function selectCalculatorCorridor(corridorId: string, amount?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Preselect>(SELECT_EVENT, { detail: parseCorridorParam(corridorId, amount ? String(amount) : null) }));
}

/** Lien vers le simulateur de /transfert avec un corridor présélectionné. */
export function simulatorHref(corridorId: string): string {
  return `/transfert?corridor=${encodeURIComponent(corridorId)}#simulateur`;
}

/* ------------------------------------------------------------------ */

export function TransferCalculator({
  className = "",
  id,
  compact = false,
}: {
  className?: string;
  /** Ancre facultative (ex. « simulateur »). */
  id?: string;
  /** Version resserrée (accueil) pour tenir au-dessus de la ligne de flottaison. */
  compact?: boolean;
}) {
  const t = useT(calculatorMessages);
  const { locale } = useI18n();
  const tag = localeTag(locale);

  const [corridors, setCorridors] = useState<CorridorMeta[]>([]);
  const [metaState, setMetaState] = useState<"loading" | "ready" | "error">("loading");
  const [metaNonce, setMetaNonce] = useState(0);

  const [sourceCode, setSourceCode] = useState("CA");
  const [destCode, setDestCode] = useState("CM");
  const [mode, setMode] = useState<Mode>("send");
  const [sendText, setSendText] = useState("100");
  const [receiveText, setReceiveText] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const lastKeyRef = useRef("");

  /* Présélection via l'URL ou un événement de page ------------------- */
  useEffect(() => {
    const apply = (p: Preselect) => {
      if (p.source) setSourceCode(p.source);
      if (p.dest) setDestCode(p.dest);
      if (p.source || p.dest || p.amount) {
        setMode("send");
        setQuote(null);
        setReceiveText("");
      }
      if (p.amount) setSendText(String(p.amount));
      else if (p.source) {
        const cur = p.source === "CM" ? "XAF" : p.source === "CN" ? "CNY" : "CAD";
        setSendText(String(DEFAULT_AMOUNT[cur]));
      }
    };
    try {
      const params = new URLSearchParams(window.location.search);
      apply(parseCorridorParam(params.get("corridor"), params.get("amount")));
    } catch {
      /* URL illisible : on garde les valeurs par défaut */
    }
    const onSelect = (e: Event) => apply((e as CustomEvent<Preselect>).detail ?? {});
    window.addEventListener(SELECT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_EVENT, onSelect);
  }, []);

  /* Corridors ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    setMetaState("loading");
    fetch("/api/quotes?meta=corridors")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("meta"))))
      .then((data: unknown) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length) {
          setCorridors(data as CorridorMeta[]);
          setMetaState("ready");
        } else {
          setMetaState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setMetaState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [metaNonce]);

  const sources = useMemo(() => {
    const map = new Map<string, { code: string; name: string; currency: string }>();
    for (const c of corridors) {
      if (!map.has(c.sourceCode)) {
        map.set(c.sourceCode, { code: c.sourceCode, name: c.sourceName, currency: c.sendCurrency });
      }
    }
    return [...map.values()];
  }, [corridors]);

  const destinations = useMemo(() => {
    const map = new Map<string, { code: string; name: string; currency: string }>();
    for (const c of corridors) {
      if (c.sourceCode === sourceCode && !map.has(c.destCode)) {
        map.set(c.destCode, { code: c.destCode, name: c.destName, currency: c.receiveCurrency });
      }
    }
    return [...map.values()];
  }, [corridors, sourceCode]);

  // Garder une destination valide si la source change.
  const effectiveDest =
    destinations.length && !destinations.some((d) => d.code === destCode)
      ? destinations[0].code
      : destCode;

  const corridor = corridors.find((c) => c.sourceCode === sourceCode && c.destCode === effectiveDest);
  const corridorId = corridor?.id ?? `${sourceCode}-${effectiveDest}`;
  const sendCurrency = corridor?.sendCurrency ?? sources.find((s) => s.code === sourceCode)?.currency ?? "CAD";
  const receiveCurrency =
    corridor?.receiveCurrency ?? destinations.find((d) => d.code === effectiveDest)?.currency ?? "XAF";

  /* Validation côté client (dérivée, sans appel réseau) -------------- */
  const activeText = mode === "send" ? sendText : receiveText;
  const activeValue = parseAmount(activeText);

  let validationError: string | null = null;
  if (metaState === "ready") {
    if (!corridor || !corridor.active) validationError = t("unavailable");
    else if (!Number.isFinite(activeValue) || activeValue <= 0) validationError = t("enterAmount");
    else if (mode === "send" && activeValue < corridor.minSend)
      validationError = t("minAmount", { amount: formatMoney(corridor.minSend, sendCurrency, tag) });
    else if (mode === "send" && activeValue > corridor.maxSend)
      validationError = t("maxAmount", { amount: formatMoney(corridor.maxSend, sendCurrency, tag) });
  }

  const mapServerError = useCallback(
    (message: unknown): string => {
      if (typeof message === "string") {
        const min = message.match(/Minimum amount is ([\d.]+) ([A-Z]{3})/);
        if (min) return t("minAmount", { amount: formatMoney(Number(min[1]), min[2], tag) });
        const max = message.match(/Maximum amount is ([\d.]+) ([A-Z]{3})/);
        if (max) return t("maxAmount", { amount: formatMoney(Number(max[1]), max[2], tag) });
        if (/not available/i.test(message)) return t("unavailable");
      }
      return t("errorQuote");
    },
    [t, tag],
  );

  /* Devis en direct (debounce) -------------------------------------- */
  const canQuote = metaState === "ready" && !validationError;

  useEffect(() => {
    if (!canQuote) {
      setLoading(false);
      // Montant invalide : on vide le montant calculé pour ne pas afficher un résultat périmé.
      if (metaState === "ready") {
        if (mode === "send") setReceiveText("");
        else setSendText("");
      }
      return;
    }
    const key = `${corridorId}|${mode}|${activeValue}`;
    const isNewRequest = key !== lastKeyRef.current;
    const controller = new AbortController();
    setLoading(true);
    if (isNewRequest) setQuoteError(null);

    const timer = setTimeout(
      async () => {
        try {
          const param = mode === "send" ? "amount" : "receive";
          const res = await fetch(
            `/api/quotes?corridor=${encodeURIComponent(corridorId)}&${param}=${encodeURIComponent(String(activeValue))}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const data = await res.json().catch(() => ({}));
          if (controller.signal.aborted) return;
          if (!res.ok || typeof data?.rate !== "number") {
            setQuote(null);
            setQuoteError(mapServerError(data?.error));
            if (mode === "send") setReceiveText("");
            else setSendText("");
          } else {
            const q = data as Quote;
            lastKeyRef.current = key;
            setQuote(q);
            setQuoteError(null);
            setNow(Date.now());
            if (mode === "send") setReceiveText(String(q.receiveAmount));
            else setSendText(String(q.sendAmount));
          }
          setLoading(false);
        } catch (err) {
          if ((err as Error)?.name === "AbortError") return;
          setQuoteError(t("errorQuote"));
          setLoading(false);
        }
      },
      isNewRequest ? DEBOUNCE_MS : 0,
    );

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [canQuote, metaState, corridorId, mode, activeValue, refreshNonce, mapServerError, t]);

  // Rafraîchissement automatique du taux + horloge « il y a X s ».
  useEffect(() => {
    const refresh = setInterval(() => setRefreshNonce((n) => n + 1), REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, []);

  /* Handlers --------------------------------------------------------- */
  const onSourceChange = (code: string) => {
    setSourceCode(code);
    const currency = corridors.find((c) => c.sourceCode === code)?.sendCurrency;
    if (currency && DEFAULT_AMOUNT[currency]) setSendText(String(DEFAULT_AMOUNT[currency]));
    setMode("send");
    setQuote(null);
    setReceiveText("");
  };
  const onDestChange = (code: string) => {
    setDestCode(code);
    setMode("send");
    setQuote(null);
    setReceiveText("");
  };

  /* Rendu ------------------------------------------------------------ */
  const showQuote = quote && quote.corridorId === corridorId && !validationError ? quote : null;
  const secondsAgo = showQuote?.fx?.fetchedAt
    ? Math.max(0, Math.floor((now - new Date(showQuote.fx.fetchedAt).getTime()) / 1000))
    : null;

  const etaLabel = (eta: string) =>
    eta === "A few minutes" ? t("etaMinutes") : eta === "Under 24h" ? t("etaDay") : eta;

  const message = validationError ?? quoteError;
  const fromName = countryName(sourceCode, locale, sources.find((s) => s.code === sourceCode)?.name);
  const toName = countryName(effectiveDest, locale, destinations.find((d) => d.code === effectiveDest)?.name);

  return (
    <div
      id={id}
      className={`w-full scroll-mt-24 overflow-hidden rounded-3xl border border-white/60 bg-white text-ink shadow-float ${className}`}
    >
      {/* En-tête */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 sm:px-6 ${
          compact ? "py-3" : "py-4"
        }`}
      >
        <h2 className="font-display text-base font-extrabold tracking-tight">{t("title")}</h2>
        <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
          <span className="live-dot" aria-hidden />
          {t("liveRate")}
        </span>
      </div>

      {metaState === "error" ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center" role="alert">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <Icon name="info" />
          </span>
          <p className="text-sm text-muted">{t("errorCorridors")}</p>
          <Button variant="secondary" size="sm" onClick={() => setMetaNonce((n) => n + 1)}>
            {t("retry")}
          </Button>
        </div>
      ) : metaState === "loading" ? (
        <div className="space-y-3 px-5 py-6 sm:px-6" aria-busy="true" aria-live="polite">
          <span className="sr-only">{t("loadingCorridors")}</span>
          <div className="h-24 animate-pulse rounded-2xl bg-surface-soft" />
          <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-surface-soft" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-soft" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface-soft" />
          <div className="h-12 animate-pulse rounded-full bg-surface-soft" />
        </div>
      ) : (
        <div className={compact ? "space-y-2.5 px-5 py-4 sm:px-6" : "space-y-3 px-5 py-5 sm:px-6 sm:py-6"}>
          {/* Vous envoyez */}
          <AmountField
            compact={compact}
            id="calc-send"
            label={t("youSend")}
            amountLabel={t("amountSend")}
            value={sendText}
            currency={sendCurrency}
            muted={mode === "receive" && loading}
            onChange={(v) => {
              setMode("send");
              setSendText(sanitizeInput(v));
            }}
            selectLabel={t("sourceCountry")}
            selectValue={sourceCode}
            selectName={fromName}
            options={sources.map((s) => ({
              code: s.code,
              label: `${countryName(s.code, locale, s.name)} · ${s.currency}`,
            }))}
            onSelect={onSourceChange}
          />

          {/* Ligne de taux */}
          <div className="flex items-center gap-3 px-1" aria-live="polite">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-brand shadow-card">
              <Icon name="transfer" className="h-4 w-4 rotate-90" />
            </span>
            <div className="min-w-0 text-sm">
              {showQuote ? (
                <p className="font-semibold text-ink">
                  {t("rateLine", {
                    from: showQuote.sendCurrency,
                    rate: formatRate(showQuote.rate, tag),
                    to: showQuote.receiveCurrency,
                  })}
                </p>
              ) : (
                <p className="font-semibold text-muted">{loading ? t("loadingQuote") : t("swapHint")}</p>
              )}
              <p className="flex items-center gap-1.5 text-xs text-muted">
                {loading && showQuote ? (
                  <>
                    <Spinner />
                    {t("refreshing")}
                  </>
                ) : secondsAgo != null ? (
                  <>
                    {showQuote?.fx?.stale && <span className="text-warn">{t("staleRate")} · </span>}
                    {secondsAgo < 3 ? t("updatedNow") : t("updatedAgo", { s: secondsAgo })}
                  </>
                ) : (
                  t("swapHint")
                )}
              </p>
            </div>
          </div>

          {/* Ils reçoivent */}
          <AmountField
            compact={compact}
            id="calc-receive"
            label={t("theyReceive")}
            amountLabel={t("amountReceive")}
            value={receiveText}
            currency={receiveCurrency}
            highlight
            muted={mode === "send" && loading}
            placeholder={loading ? "…" : "0"}
            onChange={(v) => {
              setMode("receive");
              setReceiveText(sanitizeInput(v));
            }}
            selectLabel={t("destCountry")}
            selectValue={effectiveDest}
            selectName={toName}
            options={destinations.map((d) => ({
              code: d.code,
              label: `${countryName(d.code, locale, d.name)} · ${d.currency}`,
            }))}
            onSelect={onDestChange}
          />

          {message && (
            <div
              className="flex items-start gap-2 rounded-2xl bg-danger/5 px-3.5 py-2.5 text-sm text-danger"
              role="status"
            >
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{message}</span>
              {/* « Réessayer » seulement pour une erreur technique, pas pour un montant hors limites. */}
              {quoteError && !validationError && quoteError === t("errorQuote") && (
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  onClick={() => setRefreshNonce((n) => n + 1)}
                >
                  {t("retry")}
                </button>
              )}
            </div>
          )}

          {/* Détail */}
          <dl
            aria-label={t("feeBreakdown")}
            className={`rounded-2xl border border-line bg-surface-soft/60 text-sm ${
              compact ? "space-y-1.5 px-4 py-3" : "space-y-2 p-4"
            }`}
          >
            <Row label={t("flatFee")} value={showQuote ? formatMoney(showQuote.feeFlat, showQuote.sendCurrency, tag) : null} />
            <Row
              label={t("percentFee", {
                p: showQuote ? new Intl.NumberFormat(tag, { maximumFractionDigits: 2 }).format(showQuote.feePercent) : "–",
              })}
              value={showQuote ? formatMoney(showQuote.feeVariable, showQuote.sendCurrency, tag) : null}
            />
            <Row label={t("totalFees")} value={showQuote ? formatMoney(showQuote.fee, showQuote.sendCurrency, tag) : null} />
            <Row
              strong
              label={t("total")}
              value={showQuote ? formatMoney(showQuote.total, showQuote.sendCurrency, tag) : null}
            />
            <Row
              label={
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Icon name="clock" className="h-4 w-4 shrink-0 text-brand" />
                  {t("delivery")}
                </span>
              }
              value={
                showQuote
                  ? etaLabel(showQuote.deliveryEstimate)
                  : corridor
                    ? etaLabel(corridor.deliveryEstimate)
                    : null
              }
            />
          </dl>
          <p className="-mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            {compact ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <Icon name="lock" className="h-3.5 w-3.5 shrink-0" />
                {t("disclaimer")}
              </span>
            ) : (
              <span />
            )}
            <Link
              href="/frais"
              className="inline-flex min-h-10 items-center gap-1 rounded text-xs font-semibold text-brand underline-offset-2 sm:min-h-0 hover:text-brand-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {t("allFees")}
              <Icon name="arrowRight" className="h-3.5 w-3.5" />
            </Link>
          </p>

          <AppDownloadButton
            corridor={corridorId}
            amount={showQuote ? showQuote.sendAmount : undefined}
            size="lg"
            className="w-full"
          />
          {!compact && (
            <p className="flex items-center justify-center gap-2 text-center text-xs font-medium text-ink">
              <span aria-hidden className="shrink-0">
                <WstLogo variant="symbol" className="h-5 w-5" />
              </span>
              {t("finishInApp")}
            </p>
          )}

          {!compact && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Icon name="lock" className="h-3.5 w-3.5" />
              {t("disclaimer")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AmountField({
  compact = false,
  id,
  label,
  amountLabel,
  value,
  currency,
  onChange,
  placeholder = "0",
  highlight = false,
  muted = false,
  selectLabel,
  selectValue,
  selectName,
  options,
  onSelect,
}: {
  compact?: boolean;
  id: string;
  label: string;
  amountLabel: string;
  value: string;
  currency: string;
  onChange: (v: string) => void;
  placeholder?: string;
  highlight?: boolean;
  muted?: boolean;
  selectLabel: string;
  selectValue: string;
  selectName: string;
  options: { code: string; label: string }[];
  onSelect: (code: string) => void;
}) {
  return (
    <div
      className={`rounded-2xl border transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10 ${
        compact ? "px-4 py-3" : "p-4"
      } ${
        highlight ? "border-brand/15 bg-brand-soft/60" : "border-line bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </label>
        {/* Sélecteur de pays : select natif transparent par-dessus un rendu avec drapeau */}
        <div className="relative inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-line bg-white py-2 pl-2 pr-7 text-sm font-semibold shadow-sm focus-within:ring-2 focus-within:ring-brand/40">
          <CountryFlag code={selectValue} size={20} title={selectName} className="shrink-0" />
          <span className="truncate">{selectName}</span>
          <Icon name="chevronDown" className="pointer-events-none absolute right-2 h-4 w-4 text-muted" />
          <select
            aria-label={selectLabel}
            value={selectValue}
            onChange={(e) => onSelect(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full opacity-0"
          >
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={`flex items-baseline gap-2 ${compact ? "mt-1" : "mt-2"}`}>
        <input
          id={id}
          aria-label={`${amountLabel} (${currency})`}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`min-w-0 flex-1 bg-transparent font-display font-extrabold ${compact ? "text-3xl" : "text-3xl sm:text-4xl"} tracking-tight outline-none transition placeholder:text-silver ${
            highlight ? "text-brand-strong" : "text-ink"
          } ${muted ? "opacity-50" : ""}`}
        />
        <span className="shrink-0 font-display text-base font-bold text-muted">{currency}</span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong = false,
}: {
  label: ReactNode;
  value: string | null;
  strong?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "border-t border-line pt-2" : ""}`}>
      <dt className={strong ? "font-semibold text-ink" : "text-muted"}>{label}</dt>
      <dd className={`text-right ${strong ? "font-display text-base font-extrabold text-ink" : "font-medium text-ink"}`}>
        {value ?? <span className="inline-block h-3.5 w-16 animate-pulse rounded bg-silver/50 align-middle" />}
      </dd>
    </div>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent ${
        light ? "border-white/80" : "border-brand"
      }`}
    />
  );
}

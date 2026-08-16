"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";

type CorridorMeta = {
  id: string;
  active: boolean;
  sourceCode: string;
  destCode: string;
  sourceFlag: string;
  destFlag: string;
  sourceName: string;
  destName: string;
  sendCurrency: string;
  receiveCurrency: string;
  deliveryEstimate: string;
  feeSend: number;
  networks: { id: string; label: string }[];
};

type Quote = {
  sendAmount: number;
  receiveAmount: number;
  rate: number;
  fee: number;
  feeFlat?: number;
  feeVariable?: number;
  feePercent?: number;
  total: number;
  sendCurrency: string;
  receiveCurrency: string;
  deliveryEstimate: string;
  corridorId: string;
  fx?: { fetchedAt: string; stale: boolean };
};

export function RemittanceCalculator() {
  const router = useRouter();
  const { t } = useI18n();
  const [corridors, setCorridors] = useState<CorridorMeta[]>([]);
  const [fromCode, setFromCode] = useState("CA");
  const [toCode, setToCode] = useState("CM");
  const [sendInput, setSendInput] = useState("100");
  const [receiveInput, setReceiveInput] = useState("");
  const [lastEdited, setLastEdited] = useState<"send" | "receive">("send");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const prevCorridorRef = useRef("CA-CM");

  const sourceCountries = useMemo(() => {
    const map = new Map<
      string,
      { code: string; flag: string; name: string; currency: string }
    >();
    for (const c of corridors) {
      if (!map.has(c.sourceCode)) {
        map.set(c.sourceCode, {
          code: c.sourceCode,
          flag: c.sourceFlag,
          name: c.sourceName,
          currency: c.sendCurrency,
        });
      }
    }
    return [...map.values()];
  }, [corridors]);

  const destCountries = useMemo(() => {
    const map = new Map<
      string,
      { code: string; flag: string; name: string; currency: string; active: boolean }
    >();
    for (const c of corridors.filter((x) => x.sourceCode === fromCode)) {
      map.set(c.destCode, {
        code: c.destCode,
        flag: c.destFlag,
        name: c.destName,
        currency: c.receiveCurrency,
        active: c.active,
      });
    }
    return [...map.values()];
  }, [corridors, fromCode]);

  const selected = useMemo(
    () =>
      corridors.find((c) => c.sourceCode === fromCode && c.destCode === toCode),
    [corridors, fromCode, toCode],
  );

  const corridorId = selected?.id ?? `${fromCode}-${toCode}`;

  useEffect(() => {
    fetch("/api/quotes?meta=corridors")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCorridors(data);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (destCountries.length && !destCountries.some((d) => d.code === toCode)) {
      setToCode(destCountries[0].code);
    }
  }, [destCountries, toCode]);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selected?.active) {
      setQuote(null);
      setQuoteLoading(false);
      setError(t("comingSoon"));
      return;
    }

    const corridorChanged = prevCorridorRef.current !== corridorId;
    prevCorridorRef.current = corridorId;

    if (corridorChanged) {
      // Reset immédiat : plus d'anciens montants/taux d'un autre pays
      setQuote(null);
      setReceiveInput("");
      setLastEdited("send");
      setError(null);
      setQuoteLoading(true);
    }

    const controller = new AbortController();
    const delay = corridorChanged ? 0 : 120;

    const timer = setTimeout(async () => {
      try {
        const qs =
          lastEdited === "send"
            ? `corridor=${corridorId}&amount=${encodeURIComponent(sendInput || "0")}`
            : `corridor=${corridorId}&receive=${encodeURIComponent(receiveInput || "0")}`;
        const res = await fetch(`/api/quotes?${qs}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error");
          setQuote(null);
          setQuoteLoading(false);
          return;
        }
        setError(null);
        setQuote(data);
        setQuoteLoading(false);
        if (lastEdited === "send") setReceiveInput(String(data.receiveAmount));
        else setSendInput(String(data.sendAmount));
      } catch {
        /* aborted */
      }
    }, delay);

    const refresh = setInterval(() => {
      fetch(
        `/api/quotes?corridor=${corridorId}&amount=${encodeURIComponent(sendInput || "100")}`,
        { cache: "no-store" },
      )
        .then((r) => r.json())
        .then((data) => {
          if (data.rate && data.corridorId === corridorId) {
            setQuote(data);
            if (lastEdited === "send") {
              setReceiveInput(String(data.receiveAmount));
            }
          }
        })
        .catch(() => undefined);
    }, 30000);

    return () => {
      controller.abort();
      clearTimeout(timer);
      clearInterval(refresh);
    };
  }, [
    sendInput,
    receiveInput,
    lastEdited,
    corridorId,
    selected?.active,
    t,
  ]);

  const secondsAgo = quote?.fx?.fetchedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(quote.fx.fetchedAt).getTime()) / 1000),
      )
    : null;
  void tick;

  const from = sourceCountries.find((c) => c.code === fromCode);
  const to = destCountries.find((c) => c.code === toCode);

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/20 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-semibold text-accent">
            <span className="live-dot" />
            {t("todaysRate")}
          </div>
          <span className="text-ink-muted">
            {quote
              ? `1 ${quote.sendCurrency} = ${quote.rate.toFixed(2)} ${quote.receiveCurrency}`
              : quoteLoading
                ? "…"
                : "…"}
            {secondsAgo != null ? ` · ${secondsAgo}s` : ""}
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-bg-soft/90 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">{t("youSend")}</span>
            <label className="flex min-w-[170px] items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
              <CountryFlag code={fromCode} size={20} title={from?.name} />
              <select
                value={fromCode}
                onChange={(e) => {
                  setFromCode(e.target.value);
                  setQuote(null);
                  setReceiveInput("");
                  setQuoteLoading(true);
                }}
                className="w-full bg-transparent outline-none"
              >
                {sourceCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={sendInput}
              disabled={!selected?.active}
              onChange={(e) => {
                setLastEdited("send");
                setSendInput(e.target.value);
              }}
              className="w-full bg-transparent font-display text-4xl font-bold outline-none disabled:opacity-50"
            />
            <span className="pb-1 text-sm font-semibold text-ink-muted">
              {from?.currency ?? "CAD"}
            </span>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-accent shadow-sm">
            ↕
          </div>
        </div>

        <div className="rounded-2xl border border-accent/15 bg-accent-soft p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">{t("theyReceive")}</span>
            <label className="flex min-w-[170px] items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold">
              <CountryFlag code={toCode} size={20} title={to?.name} />
              <select
                value={toCode}
                onChange={(e) => {
                  setToCode(e.target.value);
                  setQuote(null);
                  setReceiveInput("");
                  setQuoteLoading(true);
                }}
                className="w-full bg-transparent outline-none"
              >
                {destCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-end gap-2">
            <input
              type="number"
              value={quoteLoading && !receiveInput ? "" : receiveInput}
              placeholder={quoteLoading ? "…" : undefined}
              disabled={!selected?.active}
              onChange={(e) => {
                setLastEdited("receive");
                setReceiveInput(e.target.value);
              }}
              className="w-full bg-transparent font-display text-4xl font-bold text-accent-strong outline-none disabled:opacity-50"
            />
            <span className="pb-1 text-sm font-semibold text-ink-muted">
              {to?.currency ?? "XAF"}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {quote && selected?.active && (
          <div className="space-y-2 rounded-2xl border border-line bg-white/70 p-4 text-sm text-ink-muted">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink">
              {t("feeBreakdown")}
            </p>
            <div className="flex justify-between">
              <span>
                {t("flatFee")}
              </span>
              <span className="font-medium text-ink">
                {formatMoney(quote.feeFlat ?? 0, quote.sendCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                {t("percentFee")} ({quote.feePercent ?? 0}%)
              </span>
              <span className="font-medium text-ink">
                {formatMoney(quote.feeVariable ?? 0, quote.sendCurrency)}
              </span>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <span>{t("fee")}</span>
              <span className="font-semibold text-ink">
                {formatMoney(quote.fee, quote.sendCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("total")}</span>
              <span className="font-semibold text-ink">
                {formatMoney(quote.total, quote.sendCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t("delivery")}</span>
              <span className="font-medium text-ink">{quote.deliveryEstimate}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!selected?.active || !quote}
          onClick={() =>
            router.push(
              `/send?corridor=${corridorId}&amount=${quote?.sendAmount ?? sendInput}`,
            )
          }
          className="w-full rounded-full bg-accent py-3.5 text-base font-semibold text-white transition hover:bg-accent-strong disabled:opacity-45"
        >
          {selected?.active ? t("sendMoneyCta") : t("comingSoon")}
        </button>
      </div>
    </div>
  );
}

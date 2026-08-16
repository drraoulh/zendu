"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCad, formatXaf } from "@/lib/money";

type Quote = {
  sendAmountCad: number;
  receiveAmountXaf: number;
  rate: number;
  midRate: number;
  feeCad: number;
  totalCad: number;
  marginPercent: number;
  fx?: {
    fetchedAt: string;
    source: string;
    stale: boolean;
  };
};

export function QuoteCalculator({ ctaHref = "/send" }: { ctaHref?: string }) {
  const [amount, setAmount] = useState(100);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/quotes?amount=${amount}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error ?? "Erreur");
            setQuote(null);
          }
          return;
        }
        if (!cancelled) {
          setError(null);
          setQuote(data);
        }
      } catch {
        /* aborted */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const debounce = setTimeout(load, 180);
    const refresh = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(debounce);
      clearInterval(refresh);
    };
  }, [amount]);

  const secondsAgo = quote?.fx?.fetchedAt
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(quote.fx.fetchedAt).getTime()) / 1000),
      )
    : null;

  // keep secondsAgo reactive via tick
  void tick;

  return (
    <div className="hero-orb w-full max-w-md rounded-[1.75rem] border border-line bg-bg-elevated p-6 shadow-[0_30px_80px_rgba(16,36,28,0.1)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-accent">
          <span className="live-dot" aria-hidden />
          Taux en direct
        </div>
        <p className="text-xs text-ink-muted">
          {secondsAgo === null
            ? "…"
            : quote?.fx?.stale
              ? "Taux en cache"
              : `Il y a ${secondsAgo}s`}
        </p>
      </div>

      <label className="mb-2 block text-sm text-ink-muted">Vous envoyez</label>
      <div className="mb-5 flex items-end gap-3 border-b border-line pb-3">
        <input
          type="number"
          min={10}
          max={5000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full bg-transparent font-display text-4xl font-semibold text-ink outline-none"
        />
        <span className="rounded-full bg-bg-soft px-3 py-1 text-sm font-semibold text-ink-muted">
          CAD
        </span>
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {quote && (
        <div className="mb-6 space-y-2.5 text-sm">
          <div className="flex justify-between text-ink-muted">
            <span>Taux client</span>
            <span className="font-medium text-ink">
              1 CAD = {quote.rate.toFixed(2)} XAF
            </span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Marché</span>
            <span>1 CAD = {quote.midRate.toFixed(2)} XAF</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Frais</span>
            <span>{formatCad(quote.feeCad)}</span>
          </div>
          <div className="flex justify-between text-ink-muted">
            <span>Total à payer</span>
            <span className="font-medium text-ink">{formatCad(quote.totalCad)}</span>
          </div>
          <div className="mt-3 flex items-end justify-between rounded-2xl bg-accent-soft px-4 py-3">
            <span className="text-sm text-ink-muted">Destinataire reçoit</span>
            <span className="font-display text-2xl font-bold text-accent-strong">
              {loading ? "…" : formatXaf(quote.receiveAmountXaf)}
            </span>
          </div>
        </div>
      )}

      <Link
        href={`${ctaHref}?amount=${amount}`}
        className="inline-flex w-full items-center justify-center rounded-full bg-accent px-4 py-3.5 text-center font-semibold text-white transition hover:bg-accent-strong"
      >
        Continuer l&apos;envoi
      </Link>
    </div>
  );
}

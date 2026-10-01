"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { CorridorPair } from "@/components/transfer-app/corridor-pair";
import { StatusBadge } from "@/components/transfer-app/status-badge";
import { statusGroup, type StatusGroup } from "@/components/transfer-app/status";
import { corridorCodes } from "@/components/transfer-app/types";
import { useTransferLabels } from "@/components/transfer-app/use-transfer-labels";
import { useT } from "@/i18n/define";
import { historyMessages } from "@/i18n/history";

export type HistoryItem = {
  id: string;
  reference: string;
  corridorId: string;
  status: string;
  createdAt: string;
  receiveAmount: number;
  receiveCurrency: string;
  sendAmount: number;
  sendCurrency: string;
  recipientName: string;
  network: string;
  /** Virement bancaire : « •••• 1234 ». */
  accountMasked?: string | null;
};

type Filter = "all" | StatusGroup;

export function HistoryView({ transfers, unavailable }: { transfers: HistoryItem[]; unavailable: boolean }) {
  const t = useT(historyMessages);
  const L = useTransferLabels();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dest, setDest] = useState("all");

  const destinations = useMemo(
    () => [...new Set(transfers.map((x) => corridorCodes(x.corridorId)[1]))],
    [transfers],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: transfers.length, progress: 0, delivered: 0, issue: 0 };
    for (const x of transfers) c[statusGroup(x.status)] += 1;
    return c;
  }, [transfers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transfers.filter((x) => {
      if (filter !== "all" && statusGroup(x.status) !== filter) return false;
      if (dest !== "all" && corridorCodes(x.corridorId)[1] !== dest) return false;
      if (!q) return true;
      return x.reference.toLowerCase().includes(q) || x.recipientName.toLowerCase().includes(q);
    });
  }, [transfers, query, filter, dest]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("filterAll") },
    { id: "progress", label: t("filterProgress") },
    { id: "delivered", label: t("filterDelivered") },
    { id: "issue", label: t("filterIssues") },
  ];
  const filtered = query.trim() !== "" || filter !== "all" || dest !== "all";

  return (
    <div className="bg-bg pb-16">
      <section className="border-b border-line bg-white">
        <Container className="py-8 sm:py-10">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{t("title")}</h1>
              <p className="mt-2 max-w-xl text-muted">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/api/history/export" className={buttonClass("secondary", "md")} download>
                <Icon name="receipt" className="h-4 w-4" />
                {t("exportCsv")}
              </a>
              <ButtonLink href="/send">
                <Icon name="transfer" className="h-4 w-4" />
                {t("send")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container className="mt-6 sm:mt-8">
        {unavailable && (
          <p role="alert" className="mb-5 flex items-start gap-2 rounded-2xl bg-warn/10 px-4 py-3 text-sm font-medium text-[#8a5d06]">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            {t("dbError")}
          </p>
        )}

        {transfers.length === 0 ? (
          !unavailable && (
            <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-14 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="transfer" className="h-7 w-7" />
              </span>
              <h2 className="mt-4 font-display text-xl font-extrabold text-ink">{t("empty")}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("emptyBody")}</p>
              <ButtonLink href="/send" className="mt-6">
                {t("emptyCta")}
              </ButtonLink>
            </div>
          )
        ) : (
          <>
            {/* Filtres */}
            <div className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <label htmlFor="history-search" className="sr-only">
                    {t("searchLabel")}
                  </label>
                  <svg
                    viewBox="0 0 24 24"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    id="history-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPh")}
                    className="w-full rounded-2xl border border-line bg-surface-soft/50 py-3 pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                {destinations.length > 1 && (
                  <div className="relative">
                    <label htmlFor="history-dest" className="sr-only">
                      {t("destination")}
                    </label>
                    <select
                      id="history-dest"
                      value={dest}
                      onChange={(e) => setDest(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-line bg-white py-3 pl-3.5 pr-10 text-sm font-semibold text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 sm:w-56"
                    >
                      <option value="all">{t("allDestinations")}</option>
                      {destinations.map((code) => (
                        <option key={code} value={code}>
                          {L.country(code)}
                        </option>
                      ))}
                    </select>
                    <Icon
                      name="chevronDown"
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    />
                  </div>
                )}
              </div>
              <div role="group" aria-label={t("filtersLabel")} className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                {filters.map((f) => {
                  const active = filter === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(f.id)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                        active ? "bg-navy text-white" : "bg-surface-soft text-muted hover:text-ink"
                      }`}
                    >
                      {f.label}
                      <span
                        className={`rounded-full px-1.5 text-xs ${active ? "bg-white/15 text-white" : "bg-white text-muted"}`}
                      >
                        {counts[f.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted">
              <p aria-live="polite">{t("count", { n: visible.length })}</p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                    setDest("all");
                  }}
                  className="font-semibold text-brand hover:text-brand-strong"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>

            {visible.length === 0 ? (
              <p className="mt-4 rounded-3xl border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted">
                {t("noResults")}
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {visible.map((item) => {
                  const [from, to] = corridorCodes(item.corridorId);
                  return (
                    <li
                      key={item.id}
                      className="group rounded-3xl border border-line bg-white shadow-card transition hover:border-brand/30"
                    >
                      <Link href={`/transfers/${item.id}`} className="flex items-start gap-4 p-4 sm:items-center sm:p-5">
                        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-navy font-display text-base font-bold text-white sm:grid">
                          {item.recipientName.trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CorridorPair from={from} to={to} size={18} />
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-2 truncate font-semibold text-ink">{item.recipientName}</p>
                          <p className="truncate text-xs text-muted">
                            <span className="font-display font-bold tracking-wider">{item.reference}</span> ·{" "}
                            {L.network(item.network)}
                            {item.accountMasked ? ` ${item.accountMasked}` : ""} · {L.dateTime(item.createdAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-base font-extrabold text-brand-strong sm:text-lg">
                            {L.money(item.receiveAmount, item.receiveCurrency)}
                          </p>
                          <p className="text-xs text-muted sm:text-sm">{L.money(item.sendAmount, item.sendCurrency)}</p>
                        </div>
                      </Link>
                      <div className="flex gap-4 border-t border-line px-4 py-2.5 text-xs font-semibold sm:px-5">
                        <Link href={`/transfers/${item.id}`} className="inline-flex items-center gap-1 text-brand hover:text-brand-strong">
                          {t("track")}
                          <Icon name="arrowRight" className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/transfers/${item.id}/receipt`}
                          className="inline-flex items-center gap-1 text-muted hover:text-ink"
                        >
                          <Icon name="receipt" className="h-3.5 w-3.5" />
                          {t("receipt")}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

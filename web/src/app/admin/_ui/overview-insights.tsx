"use client";

import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { Icon, type IconName } from "@/components/ui/icon";
import { useTransferLabels } from "@/components/transfer-app/use-transfer-labels";
import { useT } from "@/i18n/define";
import { adminInsightsMessages } from "@/i18n/admin-insights";
import { formatMoney } from "@/lib/money";
import type { ActionCounts, InsightPeriod, TransferInsights } from "../_server/insights";
import { Panel, useAdminT } from "./kit";

const PERIODS: InsightPeriod[] = [7, 30, 90];

/** Dossiers qui attendent l'équipe, en tête de la vue d'ensemble. */
export function TodoStrip({ counts }: { counts: ActionCounts }) {
  const t = useT(adminInsightsMessages);
  const items: { key: Parameters<typeof t>[0]; n: number | null; href: string; icon: IconName; tone: string }[] = [
    { key: "todoInterac", n: counts.interac, href: "/admin/transferts#admin-interac-queue", icon: "card", tone: "text-brand bg-brand-soft" },
    { key: "todoPayouts", n: counts.payouts, href: "/admin/transferts#admin-bank-queue", icon: "wallet", tone: "text-warn bg-warn/10" },
    { key: "todoIssues", n: counts.issues, href: "/admin/transferts#admin-issues-queue", icon: "info", tone: "text-danger bg-danger/10" },
    { key: "todoKyc", n: counts.kycPending, href: "/admin/clients?kyc=pending", icon: "shield", tone: "text-brand-strong bg-sky/15" },
    { key: "todoRequests", n: counts.newRequests, href: "/admin/demandes?status=new", icon: "mail", tone: "text-success bg-success/10" },
  ];
  // Une table absente (null) n'apparaît pas : rien à traiter de ce côté.
  const visible = items.filter((i) => i.n !== null);
  const pending = visible.filter((i) => (i.n ?? 0) > 0);

  return (
    <section aria-labelledby="ov-todo" className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
      <h2 id="ov-todo" className="font-display text-base font-bold text-ink sm:text-lg">
        {t("todoTitle")}
      </h2>
      {pending.length === 0 ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          <Icon name="check" className="h-4 w-4" />
          {t("todoAllClear")}
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {visible.map((i) => {
            const n = i.n ?? 0;
            return (
              <li key={i.key}>
                <Link
                  href={i.href}
                  className={`flex h-full items-center gap-3 rounded-2xl border p-3.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                    n > 0 ? "border-line bg-white hover:border-brand/40 hover:shadow-card" : "border-transparent bg-surface-soft opacity-70"
                  }`}
                >
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${i.tone}`}>
                    <Icon name={i.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-2xl font-extrabold leading-none text-ink">{n}</span>
                    <span className="mt-1 block text-xs font-medium leading-snug text-muted">{t(i.key)}</span>
                  </span>
                  {n > 0 && <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-brand" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Delta({ current, previous }: { current: number; previous: number }) {
  const t = useT(adminInsightsMessages);
  if (previous === 0) {
    return <p className="mt-1 text-xs text-muted">{current > 0 ? t("noPrevious") : "\u00a0"}</p>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const tone = pct > 0 ? "text-success" : pct < 0 ? "text-danger" : "text-muted";
  const sign = pct > 0 ? "+" : "";
  return <p className={`mt-1 text-xs font-semibold ${tone}`}>{t("vsPrevious", { delta: `${sign}${pct} %` })}</p>;
}

function MoneyLines({ amounts, nl }: { amounts: Record<string, number>; nl: string }) {
  const entries = Object.entries(amounts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <span>{formatMoney(0, "CAD", nl)}</span>;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {entries.map(([cur, v]) => (
        <span key={cur} className="whitespace-nowrap">
          {formatMoney(v, cur, nl)}
        </span>
      ))}
    </span>
  );
}

/** Activité financière des transferts : période, indicateurs, graphique et corridors. */
export function ActivitySection({ insights, period }: { insights: TransferInsights | null; period: InsightPeriod }) {
  const t = useT(adminInsightsMessages);
  const { nl, day } = useAdminT();
  const { country } = useTransferLabels();
  const shortDay = (ymd: string) =>
    new Intl.DateTimeFormat(nl, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));

  const tabs = (
    <div role="group" aria-label={t("periodLabel")} className="inline-flex rounded-full border border-line bg-surface-soft p-1">
      {PERIODS.map((p) => (
        <Link
          key={p}
          href={`/admin?period=${p}`}
          scroll={false}
          aria-current={p === period ? "true" : undefined}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            p === period ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {t(`period${p}` as "period7" | "period30" | "period90")}
        </Link>
      ))}
    </div>
  );

  if (!insights) {
    return (
      <Panel id="ov-activity" title={t("activityTitle")} actions={tabs}>
        <p className="text-sm text-muted">{t("insightsUnavailable")}</p>
      </Panel>
    );
  }

  const max = Math.max(1, ...insights.series.map((s) => s.created));
  const labelEvery = insights.series.length > 14 ? Math.ceil(insights.series.length / 6) : 1;
  const success = insights.successRate === null ? "—" : `${Math.round(insights.successRate * 100)} %`;

  return (
    <section aria-labelledby="ov-activity" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="ov-activity" className="font-display text-lg font-bold text-ink sm:text-xl">
          {t("activityTitle")}
        </h2>
        {tabs}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <li className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-medium text-muted">{t("kpiCreated")}</p>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{insights.created}</p>
          <Delta current={insights.created} previous={insights.createdPrevious} />
        </li>
        <li className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-medium text-muted">{t("kpiSuccess")}</p>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{success}</p>
          <p className="mt-1 text-xs text-muted">{t("kpiSuccessHint")}</p>
        </li>
        <li className="bg-brand-gradient col-span-2 rounded-3xl p-4 text-white shadow-card sm:p-5 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{t("kpiVolume")}</p>
          <p className="mt-1.5 font-display text-xl font-extrabold tracking-tight sm:text-2xl">
            <MoneyLines amounts={insights.volume} nl={nl} />
          </p>
        </li>
        <li className="col-span-2 rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5 xl:col-span-1">
          <p className="text-xs font-medium text-muted">{t("kpiFees")}</p>
          <p className="mt-1.5 font-display text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
            <MoneyLines amounts={insights.fees} nl={nl} />
          </p>
        </li>
      </ul>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel id="ov-chart" title={insights.bucketDays === 7 ? t("chartTitleWeek") : t("chartTitle")}>
          {insights.created === 0 ? (
            <p className="text-sm text-muted">{t("chartEmpty")}</p>
          ) : (
            <>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand/25" aria-hidden />
                  {t("chartCreated")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-brand" aria-hidden />
                  {t("chartDelivered")}
                </span>
              </div>
              <ol className="mt-4 flex h-44 items-end gap-[3px] sm:gap-1">
                {insights.series.map((s) => {
                  const label = t("chartDay", { date: day(s.start), created: s.created, delivered: s.delivered });
                  return (
                    <li key={s.start} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={label}>
                      <span className="sr-only">{label}</span>
                      <div
                        className="relative w-full overflow-hidden rounded-t-md bg-brand/25 transition group-hover:bg-brand/35"
                        style={{ height: `${(s.created / max) * 100}%`, minHeight: s.created > 0 ? 4 : 0 }}
                        aria-hidden
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 bg-brand"
                          style={{ height: `${s.created > 0 ? (s.delivered / s.created) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
              <ol className="mt-2 flex gap-[3px] text-[10px] text-muted sm:gap-1" aria-hidden>
                {insights.series.map((s, i) => (
                  <li key={s.start} className="min-w-0 flex-1 truncate text-center">
                    {i % labelEvery === 0 || i === insights.series.length - 1 ? shortDay(s.start) : ""}
                  </li>
                ))}
              </ol>
            </>
          )}
        </Panel>

        <Panel id="ov-corridors" title={t("corridorsTitle")}>
          {insights.corridors.length === 0 ? (
            <p className="text-sm text-muted">{t("corridorsEmpty")}</p>
          ) : (
            <ul className="space-y-3">
              {insights.corridors.map((c) => (
                <li key={`${c.source}-${c.dest}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <CountryFlag code={c.source} size={20} title={country(c.source)} />
                    <Icon name="arrowRight" className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <CountryFlag code={c.dest} size={20} title={country(c.dest)} />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{country(c.dest)}</span>
                    <span className="shrink-0 text-xs font-semibold text-muted">{t("corridorCount", { n: c.count })}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-soft" aria-hidden>
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(c.count / insights.corridors[0].count) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  );
}

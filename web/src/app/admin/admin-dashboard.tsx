"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Container, Eyebrow } from "@/components/ui/layout";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { adminMessages } from "@/i18n/admin";
import { formatMoney } from "@/lib/money";

export type AdminTransferRow = {
  id: string;
  reference: string;
  status: string;
  sendCurrency: string;
  receiveCurrency: string;
  totalCad: number;
  receiveAmountXaf: number;
  senderName: string;
  recipientName: string;
  recipientPhone: string;
  recipientNetwork: string;
  createdAt: string;
};

type Key = keyof typeof adminMessages.fr;
type Tone = "brand" | "success" | "warn" | "danger" | "neutral";

const STATUS: Record<string, { label: Key; tone: Tone }> = {
  draft: { label: "statusDraft", tone: "neutral" },
  quoted: { label: "statusQuoted", tone: "neutral" },
  awaiting_payment: { label: "statusAwaiting", tone: "warn" },
  payment_detected: { label: "statusPaymentDetected", tone: "brand" },
  payout_queued: { label: "statusPayoutQueued", tone: "brand" },
  payout_sent: { label: "statusPayoutSent", tone: "brand" },
  delivered: { label: "statusDelivered", tone: "success" },
  payment_mismatch: { label: "statusMismatch", tone: "danger" },
  payout_failed: { label: "statusPayoutFailed", tone: "danger" },
  expired: { label: "statusExpired", tone: "neutral" },
  cancelled: { label: "statusCancelled", tone: "neutral" },
};

const IN_PROGRESS = new Set(["payment_detected", "payout_queued", "payout_sent"]);

const NUMBER_LOCALE: Record<string, string> = { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" };

export function AdminDashboard({
  transfers,
  payInMode,
  payoutMode,
}: {
  transfers: AdminTransferRow[] | null;
  payInMode: string;
  payoutMode: string;
}) {
  const t = useT(adminMessages);
  const { locale } = useI18n();
  const nl = NUMBER_LOCALE[locale] ?? "fr-CA";

  const statusText = (s: string) => (STATUS[s] ? t(STATUS[s].label) : s);
  const statusBadge = (s: string) => (
    <Badge tone={STATUS[s]?.tone ?? "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {statusText(s)}
    </Badge>
  );
  const date = (iso: string) =>
    new Intl.DateTimeFormat(nl, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const rows = transfers ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const counts = Object.entries(
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const volumeByCurrency = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.sendCurrency] = (acc[r.sendCurrency] ?? 0) + r.totalCad;
    return acc;
  }, {});
  const volume =
    Object.entries(volumeByCurrency)
      .map(([cur, n]) => formatMoney(n, cur, nl))
      .join(" · ") || formatMoney(0, "CAD", nl);

  const kpis: { label: Key; value: string; icon: IconName; tone: string }[] = [
    { label: "kpiTotal", value: String(rows.length), icon: "receipt", tone: "bg-brand-soft text-brand" },
    { label: "kpiAwaiting", value: String(count("awaiting_payment")), icon: "clock", tone: "bg-warn/10 text-warn" },
    {
      label: "kpiInProgress",
      value: String(rows.filter((r) => IN_PROGRESS.has(r.status)).length),
      icon: "transfer",
      tone: "bg-sky/15 text-brand-strong",
    },
    { label: "kpiDelivered", value: String(count("delivered")), icon: "check", tone: "bg-success/10 text-success" },
    { label: "kpiFailed", value: String(count("payout_failed")), icon: "info", tone: "bg-danger/10 text-danger" },
  ];

  const modePill = (label: string, mode: string) => {
    const mock = mode.startsWith("mock");
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
        <span className={`h-2 w-2 rounded-full ${mock ? "bg-warn" : "bg-success"}`} aria-hidden />
        {label} : <code className="font-mono">{mode}</code>
        <span className="text-white/60">({mock ? t("modeMock") : t("modeLive")})</span>
      </span>
    );
  };

  return (
    <div className="bg-bg pb-16">
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative py-10 sm:py-14">
          <Eyebrow light>{t("eyebrow")}</Eyebrow>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-white/70">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {modePill(t("payIn"), payInMode)}
            {modePill(t("payout"), payoutMode)}
          </div>
        </Container>
      </section>

      <Container className="-mt-6 relative">
        {transfers === null ? (
          <div
            role="alert"
            className="rounded-3xl border border-danger/25 bg-white p-6 shadow-card sm:flex sm:items-start sm:gap-4"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <Icon name="info" />
            </span>
            <div className="mt-3 flex-1 sm:mt-0">
              <h2 className="font-display text-lg font-bold text-ink">{t("dbErrorTitle")}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{t("dbErrorText")}</p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={() => window.location.reload()}>
                {t("reload")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* KPI */}
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              {kpis.map((k) => (
                <li key={k.label} className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}>
                    <Icon name={k.icon} className="h-4.5 w-4.5" />
                  </span>
                  <p className="mt-3 text-xs font-medium text-muted">{t(k.label)}</p>
                  <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{k.value}</p>
                </li>
              ))}
              <li className="bg-brand-gradient col-span-2 rounded-3xl p-4 text-white shadow-card sm:p-5 lg:col-span-5 lg:flex lg:items-center lg:justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">{t("kpiVolume")}</p>
                <p className="mt-1 break-words font-display text-2xl font-extrabold tracking-tight lg:mt-0">
                  {volume}
                </p>
              </li>
            </ul>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              {/* Transferts */}
              <section aria-labelledby="admin-recent" className="min-w-0">
                <h2 id="admin-recent" className="font-display text-xl font-bold text-ink">
                  {t("recent")}
                </h2>

                {rows.length === 0 ? (
                  <div className="mt-4 rounded-3xl border border-dashed border-line bg-white p-10 text-center">
                    <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                      <Icon name="receipt" />
                    </span>
                    <p className="mt-3 text-sm text-muted">{t("empty")}</p>
                    <ButtonLink href="/send" size="sm" className="mt-4">
                      {t("emptyCta")}
                    </ButtonLink>
                  </div>
                ) : (
                  <>
                    {/* Tableau (≥ md) */}
                    <div className="mt-4 hidden overflow-hidden rounded-3xl border border-line bg-white shadow-card md:block">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-surface-soft text-xs uppercase tracking-wider text-muted">
                          <tr>
                            <th scope="col" className="px-4 py-3 font-semibold">{t("colRef")}</th>
                            <th scope="col" className="px-4 py-3 font-semibold">{t("colStatus")}</th>
                            <th scope="col" className="px-4 py-3 text-right font-semibold">{t("colAmount")}</th>
                            <th scope="col" className="px-4 py-3 font-semibold">{t("colRecipient")}</th>
                            <th scope="col" className="px-4 py-3"><span className="sr-only">{t("open")}</span></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {rows.map((r) => (
                            <tr key={r.id} className="transition hover:bg-surface-soft/50">
                              <td className="px-4 py-3 align-top">
                                <span className="font-mono text-xs font-semibold text-ink">{r.reference}</span>
                                <span className="mt-0.5 block text-xs text-muted">{date(r.createdAt)}</span>
                              </td>
                              <td className="px-4 py-3 align-top">{statusBadge(r.status)}</td>
                              <td className="px-4 py-3 text-right align-top">
                                <span className="font-semibold text-ink">
                                  {formatMoney(r.totalCad, r.sendCurrency, nl)}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted">
                                  {formatMoney(r.receiveAmountXaf, r.receiveCurrency, nl)}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span className="font-medium text-ink">{r.recipientName}</span>
                                <span className="mt-0.5 block text-xs text-muted">
                                  {r.recipientPhone} · {r.recipientNetwork}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right align-top">
                                <Link
                                  href={`/transfers/${r.id}`}
                                  aria-label={t("openTransfer", { ref: r.reference })}
                                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand-soft"
                                >
                                  {t("open")}
                                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cartes (mobile) */}
                    <ul className="mt-4 space-y-3 md:hidden">
                      {rows.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`/transfers/${r.id}`}
                            aria-label={t("openTransfer", { ref: r.reference })}
                            className="block rounded-3xl border border-line bg-white p-4 shadow-card transition active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-xs font-semibold text-ink">{r.reference}</p>
                                <p className="mt-0.5 text-xs text-muted">{date(r.createdAt)}</p>
                              </div>
                              {statusBadge(r.status)}
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-ink">{r.recipientName}</p>
                                <p className="truncate text-xs text-muted">
                                  {r.recipientPhone} · {r.recipientNetwork}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-bold text-ink">
                                  {formatMoney(r.totalCad, r.sendCurrency, nl)}
                                </p>
                                <p className="text-xs text-muted">
                                  {formatMoney(r.receiveAmountXaf, r.receiveCurrency, nl)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>

              {/* Colonne latérale */}
              <aside className="space-y-6">
                <section aria-labelledby="admin-status" className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <h2 id="admin-status" className="font-display text-base font-bold text-ink">
                    {t("byStatus")}
                  </h2>
                  {counts.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">—</p>
                  ) : (
                    <ul className="mt-4 space-y-3">
                      {counts.map(([status, n]) => (
                        <li key={status}>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate text-ink">{statusText(status)}</span>
                            <span className="font-semibold text-ink">{n}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-soft" aria-hidden>
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.max(4, (n / rows.length) * 100)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-labelledby="admin-links" className="rounded-3xl border border-line bg-white p-5 shadow-card">
                  <h2 id="admin-links" className="font-display text-base font-bold text-ink">
                    {t("links")}
                  </h2>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li>
                      <p className="text-muted">{t("linkSpec")}</p>
                      <code className="mt-0.5 block break-all text-xs text-ink">docs/momo-disbursement.openapi.json</code>
                    </li>
                    <li>
                      <p className="text-muted">{t("linkBalance")}</p>
                      <a href="/api/momo/balance" className="mt-0.5 block break-all font-mono text-xs text-brand hover:underline">
                        /api/momo/balance
                      </a>
                    </li>
                    <li>
                      <p className="text-muted">{t("linkWebhook")}</p>
                      <code className="mt-0.5 block break-all text-xs text-ink">POST /api/webhooks/momo</code>
                    </li>
                    <li>
                      <p className="text-muted">{t("linkHistory")}</p>
                      <a
                        href="/api/history/export"
                        className="mt-0.5 block break-all font-mono text-xs text-brand hover:underline"
                      >
                        /api/history/export
                      </a>
                    </li>
                  </ul>
                </section>
              </aside>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

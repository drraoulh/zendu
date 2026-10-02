"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { REQUEST_KINDS, REQUEST_STATUSES, SHIPMENT_STATUSES } from "@/lib/requests";
import type { AdminRequest } from "../_server/data";
import { DbError, KIND_ICON, PageTitle, Panel, RequestStatusBadge, useAdminT } from "./kit";

type Data = {
  requests: { kind: string; status: string; count: number }[];
  shipments: { status: string; count: number }[];
  transfers: { status: string; count: number }[] | null;
  recentRequests: AdminRequest[];
};

function Bars({ rows, total }: { rows: { label: string; count: number; href?: string }[]; total: number }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between gap-2 text-sm">
            {r.href ? (
              <Link href={r.href} className="truncate text-ink hover:text-brand hover:underline">
                {r.label}
              </Link>
            ) : (
              <span className="truncate text-ink">{r.label}</span>
            )}
            <span className="font-semibold text-ink">{r.count}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-soft" aria-hidden>
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${total > 0 ? Math.max(r.count > 0 ? 4 : 0, (r.count / total) * 100) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdminOverview({ data }: { data: Data | null }) {
  const { t, label, dateTime } = useAdminT();

  if (!data) {
    return (
      <div className="space-y-6">
        <PageTitle title={t("ovTitle")} subtitle={t("ovSubtitle")} />
        <DbError />
      </div>
    );
  }

  const sum = (rows: { count: number }[]) => rows.reduce((n, r) => n + r.count, 0);
  const reqTotal = sum(data.requests);
  const byKind = REQUEST_KINDS.map((kind) => {
    const rows = data.requests.filter((r) => r.kind === kind);
    return { kind, total: sum(rows), fresh: sum(rows.filter((r) => r.status === "new")) };
  });
  const byStatus = REQUEST_STATUSES.map((status) => ({
    status,
    count: sum(data.requests.filter((r) => r.status === status)),
  }));
  const shipTotal = sum(data.shipments);
  const activeShipments = sum(data.shipments.filter((s) => s.status !== "delivered"));
  const transferTotal = data.transfers ? sum(data.transfers) : null;

  const kpis: { label: string; value: string; icon: IconName; tone: string; href: string }[] = [
    { label: t("kpiNewRequests"), value: String(byStatus[0].count), icon: "mail", tone: "bg-warn/10 text-warn", href: "/admin/demandes?status=new" },
    {
      label: t("kpiOpenRequests"),
      value: String(byStatus[1].count),
      icon: "clock",
      tone: "bg-brand-soft text-brand",
      href: "/admin/demandes?status=in_progress",
    },
    { label: t("kpiActiveShipments"), value: String(activeShipments), icon: "box", tone: "bg-sky/15 text-brand-strong", href: "/admin/colis?status=active" },
    {
      label: t("kpiTransfers"),
      value: transferTotal === null ? "—" : String(transferTotal),
      icon: "transfer",
      tone: "bg-success/10 text-success",
      href: "/admin/transferts",
    },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title={t("ovTitle")} subtitle={t("ovSubtitle")} />

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <li key={k.label}>
            <Link
              href={k.href}
              className="block h-full rounded-3xl border border-line bg-white p-4 shadow-card transition hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-5"
            >
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${k.tone}`}>
                <Icon name={k.icon} className="h-4.5 w-4.5" />
              </span>
              <p className="mt-3 text-xs font-medium text-muted">{k.label}</p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{k.value}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          id="ov-kind"
          title={t("requestsByKind")}
          actions={
            <Link href="/admin/demandes" className="text-sm font-semibold text-brand hover:underline">
              {t("seeAll")}
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {byKind.map((k) => (
              <li key={k.kind}>
                <Link
                  href={`/admin/demandes?kind=${k.kind}`}
                  className="flex items-center gap-3 py-3 transition hover:text-brand"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <Icon name={KIND_ICON[k.kind] ?? "info"} className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{label("kind_", k.kind)}</span>
                    {k.fresh > 0 && <span className="text-xs font-medium text-warn">{t("newCount", { n: k.fresh })}</span>}
                  </span>
                  <span className="font-display text-xl font-extrabold text-ink">{k.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="ov-status" title={t("requestsByStatus")}>
          {reqTotal === 0 ? (
            <p className="text-sm text-muted">{t("noData")}</p>
          ) : (
            <Bars
              total={reqTotal}
              rows={byStatus.map((s) => ({ label: label("rs_", s.status), count: s.count, href: `/admin/demandes?status=${s.status}` }))}
            />
          )}
        </Panel>

        <Panel
          id="ov-ship"
          title={t("shipmentsByStatus")}
          actions={
            <Link href="/admin/colis" className="text-sm font-semibold text-brand hover:underline">
              {t("seeAll")}
            </Link>
          }
        >
          {shipTotal === 0 ? (
            <p className="text-sm text-muted">{t("noData")}</p>
          ) : (
            <Bars
              total={shipTotal}
              rows={SHIPMENT_STATUSES.map((s) => ({
                label: label("ss_", s),
                count: sum(data.shipments.filter((x) => x.status === s)),
                href: `/admin/colis?status=${s}`,
              }))}
            />
          )}
        </Panel>

        <Panel
          id="ov-transfers"
          title={t("transfersByStatus")}
          actions={
            <Link href="/admin/transferts" className="text-sm font-semibold text-brand hover:underline">
              {t("seeAll")}
            </Link>
          }
        >
          {data.transfers === null ? (
            <p className="text-sm text-muted">{t("transfersUnavailable")}</p>
          ) : transferTotal === 0 ? (
            <p className="text-sm text-muted">{t("noData")}</p>
          ) : (
            <Bars
              total={transferTotal ?? 0}
              rows={[...data.transfers].sort((a, b) => b.count - a.count).map((s) => ({ label: s.status, count: s.count }))}
            />
          )}
        </Panel>
      </div>

      <Panel
        id="ov-recent"
        title={t("recentRequests")}
        actions={
          <Link href="/admin/demandes" className="text-sm font-semibold text-brand hover:underline">
            {t("seeAll")}
          </Link>
        }
      >
        {data.recentRequests.length === 0 ? (
          <p className="text-sm text-muted">{t("noData")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.recentRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/demandes/${r.reference}`}
                  aria-label={t("openRequest", { ref: r.reference })}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 transition hover:text-brand"
                >
                  <span className="font-mono text-xs font-semibold text-ink">{r.reference}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {r.name} · <span className="text-muted">{label("kind_", r.kind)}</span>
                  </span>
                  <span className="text-xs text-muted">{dateTime(r.createdAt)}</span>
                  <RequestStatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

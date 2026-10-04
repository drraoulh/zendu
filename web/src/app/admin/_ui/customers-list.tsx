"use client";

import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { AdminCustomer, CustomerFilters } from "../_server/customers";
import { CUSTOMER_STATUSES, KYC_STATUSES } from "../_server/customers-constants";
import { AccountBadge, COUNTRY_LABEL, KycBadge, useCustomersT } from "./customers-kit";
import { Field, inputClass, PageTitle, useAdminT } from "./kit";

type Data = { rows: AdminCustomer[]; total: number; page: number; pageSize: number; kycCounts: Record<string, number> };

function href(f: CustomerFilters, page: number) {
  const sp = new URLSearchParams();
  if (f.kyc) sp.set("kyc", f.kyc);
  if (f.status) sp.set("status", f.status);
  if (f.q) sp.set("q", f.q);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/clients${qs ? `?${qs}` : ""}`;
}

export function CustomersList({ data, filters }: { data: Data | null; filters: CustomerFilters }) {
  const { t, label } = useCustomersT();
  const { dateTime } = useAdminT();
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pending = data?.kycCounts.pending ?? 0;

  return (
    <div className="space-y-6">
      <PageTitle
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <ButtonLink href="/admin/clients/nouveau" size="md">
            <Icon name="user" className="h-4 w-4" />
            {t("newCustomer")}
          </ButtonLink>
        }
      />

      {pending > 0 && filters.kyc !== "pending" && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-warn/30 bg-[#fff7e6] p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#7a5308]">
            <Icon name="shield" className="h-5 w-5" />
            {t("toReview", { n: pending })}
          </p>
          <ButtonLink href="/admin/clients?kyc=pending" size="sm" variant="secondary">
            {t("reviewNow")}
          </ButtonLink>
        </div>
      )}

      <form method="get" action="/admin/clients" role="search" className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <Field id="c-kyc" label={t("filterKyc")}>
            <select id="c-kyc" name="kyc" defaultValue={filters.kyc ?? ""} className={inputClass}>
              <option value="">{t("all")}</option>
              {KYC_STATUSES.map((k) => (
                <option key={k} value={k}>
                  {label("kyc_", k)}
                  {data?.kycCounts[k] ? ` (${data.kycCounts[k]})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field id="c-status" label={t("filterStatus")}>
            <select id="c-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">{t("all")}</option>
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label("st_", s)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="c-q" label={t("filterSearch")} className="sm:col-span-2 lg:col-span-1">
            <input id="c-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder={t("searchPlaceholder")} className={inputClass} />
          </Field>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" size="md" className="flex-1 lg:flex-none">
              {t("apply")}
            </Button>
            <ButtonLink href="/admin/clients" variant="ghost" size="md">
              {t("reset")}
            </ButtonLink>
          </div>
        </div>
      </form>

      {!data ? (
        <p role="alert" className="rounded-3xl border border-danger/25 bg-white p-6 text-sm text-danger shadow-card">
          {t("dbError")}
        </p>
      ) : data.rows.length === 0 ? (
        <p className="rounded-3xl border border-line bg-white p-8 text-center text-sm text-muted shadow-card">{t("empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
          <p className="border-b border-line px-5 py-3 text-xs font-semibold text-muted">{t("total", { n: data.total })}</p>
          <ul className="divide-y divide-line">
            {data.rows.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/clients/${c.id}`}
                  className="grid gap-2 px-5 py-4 transition hover:bg-surface-soft sm:grid-cols-[minmax(0,2fr)_1fr_1fr_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {c.email} · {c.phone}
                    </p>
                  </div>
                  <p className="text-sm text-ink">
                    {COUNTRY_LABEL[c.country] ?? c.country}
                    <span className="block text-xs text-muted">{dateTime(c.createdAt)}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <KycBadge status={c.kycStatus} />
                    {c.status !== "active" && <AccountBadge status={c.status} />}
                  </div>
                  <p className="text-sm font-semibold text-ink sm:text-right">
                    {c.transferCount} <span className="font-normal text-muted">{t("colTransfers").toLowerCase()}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              {data.page > 1 ? <Link href={href(filters, data.page - 1)} className="font-semibold text-brand">←</Link> : <span />}
              <span className="text-muted">
                {data.page} / {pages}
              </span>
              {data.page < pages ? <Link href={href(filters, data.page + 1)} className="font-semibold text-brand">→</Link> : <span />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

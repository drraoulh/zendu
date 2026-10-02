"use client";

import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { REQUEST_KINDS, REQUEST_STATUSES } from "@/lib/requests";
import type { AdminRequest, RequestFilters } from "../_server/data";
import { DbError, Field, inputClass, KIND_ICON, PageTitle, RequestStatusBadge, useAdminT } from "./kit";

type Data = { rows: AdminRequest[]; total: number; page: number; pageSize: number };

function pageHref(filters: RequestFilters, page: number) {
  const sp = new URLSearchParams();
  if (filters.kind) sp.set("kind", filters.kind);
  if (filters.status) sp.set("status", filters.status);
  if (filters.q) sp.set("q", filters.q);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/admin/demandes${qs ? `?${qs}` : ""}`;
}

export function RequestsList({ data, filters }: { data: Data | null; filters: RequestFilters }) {
  const { t, label, dateTime } = useAdminT();
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageTitle title={t("rqTitle")} subtitle={t("rqSubtitle")} />

      <form method="get" action="/admin/demandes" className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5" role="search">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
          <Field id="f-kind" label={t("filterKind")}>
            <select id="f-kind" name="kind" defaultValue={filters.kind ?? ""} className={inputClass}>
              <option value="">{t("allKinds")}</option>
              {REQUEST_KINDS.map((k) => (
                <option key={k} value={k}>
                  {label("kind_", k)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-status" label={t("filterStatus")}>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">{t("allStatuses")}</option>
              {REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label("rs_", s)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-q" label={t("filterSearch")} className="sm:col-span-2 lg:col-span-1">
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder={t("searchPlaceholder")} className={inputClass} />
          </Field>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" size="md" className="flex-1 lg:flex-none">
              {t("applyFilters")}
            </Button>
            <ButtonLink href="/admin/demandes" variant="ghost" size="md">
              {t("resetFilters")}
            </ButtonLink>
          </div>
        </div>
      </form>

      {!data ? (
        <DbError />
      ) : (
        <>
          <p className="text-sm font-medium text-muted" aria-live="polite">
            {t("resultsCount", { n: data.total })}
          </p>

          {data.rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="mail" />
              </span>
              <p className="mt-3 text-sm text-muted">{t("rqEmpty")}</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-line bg-white shadow-card md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-soft text-xs uppercase tracking-wider text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">{t("colReference")}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t("colKind")}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t("colClient")}</th>
                      <th scope="col" className="px-4 py-3 font-semibold">{t("colStatus")}</th>
                      <th scope="col" className="px-4 py-3"><span className="sr-only">{t("open")}</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.rows.map((r) => (
                      <tr key={r.id} className="transition hover:bg-surface-soft/50">
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono text-xs font-semibold text-ink">{r.reference}</span>
                          <span className="mt-0.5 block text-xs text-muted">{dateTime(r.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="inline-flex items-center gap-2 text-ink">
                            <Icon name={KIND_ICON[r.kind] ?? "info"} className="h-4 w-4 text-brand" />
                            {label("kind_", r.kind)}
                          </span>
                        </td>
                        <td className="max-w-[16rem] px-4 py-3 align-top">
                          <span className="block truncate font-medium text-ink">{r.name}</span>
                          <span className="block truncate text-xs text-muted">{r.email}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <RequestStatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <Link
                            href={`/admin/demandes/${r.reference}`}
                            aria-label={t("openRequest", { ref: r.reference })}
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

              <ul className="space-y-3 md:hidden">
                {data.rows.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/demandes/${r.reference}`}
                      aria-label={t("openRequest", { ref: r.reference })}
                      className="block rounded-3xl border border-line bg-white p-4 shadow-card transition active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-ink">{r.reference}</p>
                          <p className="mt-0.5 text-xs text-muted">{dateTime(r.createdAt)}</p>
                        </div>
                        <RequestStatusBadge status={r.status} />
                      </div>
                      <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
                        <Icon name={KIND_ICON[r.kind] ?? "info"} className="h-4 w-4 shrink-0 text-brand" />
                        <span className="truncate">{label("kind_", r.kind)}</span>
                      </p>
                      <p className="mt-1 truncate text-sm text-ink">{r.name}</p>
                      <p className="truncate text-xs text-muted">{r.email}</p>
                    </Link>
                  </li>
                ))}
              </ul>

              {pages > 1 && (
                <nav aria-label={t("pageOf", { page: data.page, pages })} className="flex items-center justify-between gap-3">
                  {data.page > 1 ? (
                    <ButtonLink href={pageHref(filters, data.page - 1)} variant="secondary" size="sm">
                      {t("prevPage")}
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-muted">{t("pageOf", { page: data.page, pages })}</span>
                  {data.page < pages ? (
                    <ButtonLink href={pageHref(filters, data.page + 1)} variant="secondary" size="sm">
                      {t("nextPage")}
                    </ButtonLink>
                  ) : (
                    <span />
                  )}
                </nav>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

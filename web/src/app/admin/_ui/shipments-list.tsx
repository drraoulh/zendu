"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SHIPMENT_STATUSES, SHIPPING_MODES } from "@/lib/requests";
import type { AdminShipment, ShipmentFilters } from "../_server/data";
import { adminFetch, DbError, Field, inputClass, Message, PageTitle, Panel, ShipmentStatusBadge, useAdminT } from "./kit";

function CreateShipmentForm() {
  const { t, label } = useAdminT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError(null);
    try {
      const status = get("status");
      const res = await adminFetch<{ shipment: AdminShipment }>("/api/admin/shipments", "POST", {
        origin: get("origin"),
        destination: get("destination"),
        mode: get("mode"),
        weightKg: get("weightKg"),
        estimatedDelivery: get("estimatedDelivery"),
        recipientName: get("recipientName"),
        status,
        initialLabel: status === "received" ? t("initialEventLabel") : label("lbl_", status),
        initialLocation: get("initialLocation"),
      });
      router.push(`/admin/colis/${res.shipment.number}`);
    } catch (err) {
      setError(t("saveError", { error: err instanceof Error ? err.message : "?" }));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field id="c-origin" label={t("fOrigin")}>
        <input id="c-origin" name="origin" required minLength={2} maxLength={120} className={inputClass} />
      </Field>
      <Field id="c-destination" label={t("fDestination")}>
        <input id="c-destination" name="destination" required minLength={2} maxLength={120} className={inputClass} />
      </Field>
      <Field id="c-mode" label={t("fMode")}>
        <select id="c-mode" name="mode" defaultValue="air" className={inputClass}>
          {SHIPPING_MODES.map((m) => (
            <option key={m} value={m}>
              {label("mode_", m)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="c-weight" label={t("fWeight")}>
        <input id="c-weight" name="weightKg" type="number" min="0.01" step="0.01" inputMode="decimal" className={inputClass} />
      </Field>
      <Field id="c-eta" label={t("fEta")}>
        <input id="c-eta" name="estimatedDelivery" type="date" className={inputClass} />
      </Field>
      <Field id="c-status" label={t("fInitialStatus")}>
        <select id="c-status" name="status" defaultValue="received" className={inputClass}>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label("ss_", s)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="c-recipient" label={t("fRecipient")} hint={t("fRecipientHint")}>
        <input id="c-recipient" name="recipientName" maxLength={160} className={inputClass} />
      </Field>
      <Field id="c-location" label={t("fInitialLocation")}>
        <input id="c-location" name="initialLocation" maxLength={160} className={inputClass} />
      </Field>
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={busy}>
          <Icon name="box" className="h-4 w-4" />
          {busy ? t("creating") : t("createSubmit")}
        </Button>
      </div>
      {error && (
        <div className="sm:col-span-2 lg:col-span-3">
          <Message ok={false}>{error}</Message>
        </div>
      )}
    </form>
  );
}

export function ShipmentsList({ rows, filters }: { rows: AdminShipment[] | null; filters: ShipmentFilters }) {
  const { t, label, day, dateTime } = useAdminT();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <PageTitle
        title={t("shTitle")}
        subtitle={t("shSubtitle")}
        actions={
          <Button size="sm" onClick={() => setShowCreate((v) => !v)} aria-expanded={showCreate} aria-controls="sh-create">
            <Icon name={showCreate ? "close" : "box"} className="h-4 w-4" />
            {t("createTitle")}
          </Button>
        }
      />

      {showCreate && (
        <div id="sh-create">
          <Panel id="sh-create-title" title={t("createTitle")}>
            <CreateShipmentForm />
          </Panel>
        </div>
      )}

      <form method="get" action="/admin/colis" role="search" className="rounded-3xl border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
          <Field id="s-status" label={t("filterStatus")}>
            <select id="s-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">{t("allShipStatuses")}</option>
              <option value="active">{t("activeOnly")}</option>
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label("ss_", s)}
                </option>
              ))}
            </select>
          </Field>
          <Field id="s-q" label={t("filterSearch")}>
            <input id="s-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder={t("searchShipPlaceholder")} className={inputClass} />
          </Field>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <Button type="submit" className="flex-1 lg:flex-none">
              {t("applyFilters")}
            </Button>
            <ButtonLink href="/admin/colis" variant="ghost">
              {t("resetFilters")}
            </ButtonLink>
          </div>
        </div>
      </form>

      {!rows ? (
        <DbError />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line bg-white p-10 text-center">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Icon name="box" />
          </span>
          <p className="mt-3 text-sm text-muted">{t("shEmpty")}</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-muted">{t("shipCount", { n: rows.length })}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {rows.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/colis/${s.number}`}
                  aria-label={t("openShipment", { number: s.number })}
                  className="block h-full rounded-3xl border border-line bg-white p-4 shadow-card transition hover:border-brand/40 active:scale-[0.99] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-ink">{s.number}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("colUpdated")} · {dateTime(s.updatedAt)}
                      </p>
                    </div>
                    <ShipmentStatusBadge status={s.status} />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
                    <Icon name={s.mode === "sea" ? "ship" : "plane"} className="h-4 w-4 shrink-0 text-brand" />
                    <span className="min-w-0 truncate">
                      {s.origin} → {s.destination}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t("colEta")} : {s.estimatedDelivery ? day(s.estimatedDelivery) : t("notSet")}
                    {s.requestReference ? ` · ${t("fromRequest", { ref: s.requestReference })}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SHIPMENT_STATUSES, SHIPPING_MODES, type ShipmentStatus } from "@/lib/requests";
import type { AdminShipment } from "../_server/data";
import { adminFetch, Field, inputClass, Message, PageTitle, Panel, ShipmentStatusBadge, useAdminT } from "./kit";

/** "YYYY-MM-DDTHH:mm" dans le fuseau du navigateur (valeur d'un input datetime-local). */
function localNow(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ShipmentDetail({ shipment }: { shipment: AdminShipment }) {
  const { t, label, dateTime, day } = useAdminT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editMsg, setEditMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [eventMsg, setEventMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [eStatus, setEStatus] = useState<ShipmentStatus>("in_transit");
  const [eLabel, setELabel] = useState(() => label("lbl_", "in_transit"));
  const [labelTouched, setLabelTouched] = useState(false);
  const [eAt, setEAt] = useState(localNow);

  const errorText = (err: unknown) => t("saveError", { error: err instanceof Error ? err.message : "?" });

  async function saveInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setEditMsg(null);
    try {
      await adminFetch(`/api/admin/shipments/${shipment.number}`, "PATCH", {
        status: get("status"),
        estimatedDelivery: get("estimatedDelivery"),
        origin: get("origin"),
        destination: get("destination"),
        mode: get("mode"),
        weightKg: get("weightKg"),
        recipientName: get("recipientName"),
      });
      setEditMsg({ ok: true, text: t("saved") });
      router.refresh();
    } catch (err) {
      setEditMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function addEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setEventMsg(null);
    try {
      await adminFetch(`/api/admin/shipments/${shipment.number}/events`, "POST", {
        status: eStatus,
        label: eLabel,
        location: String(f.get("location") ?? ""),
        at: eAt ? new Date(eAt).toISOString() : undefined,
        updateShipment: f.get("updateShipment") === "on",
      });
      setEventMsg({ ok: true, text: t("eventAdded") });
      setLabelTouched(false);
      setELabel(label("lbl_", eStatus));
      setEAt(localNow());
      form.reset();
      router.refresh();
    } catch (err) {
      setEventMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(id: string) {
    if (!window.confirm(t("deleteEventConfirm"))) return;
    setBusy(true);
    setEventMsg(null);
    try {
      await adminFetch(`/api/admin/shipments/${shipment.number}/events`, "DELETE", { id });
      router.refresh();
    } catch (err) {
      setEventMsg({ ok: false, text: errorText(err) });
    } finally {
      setBusy(false);
    }
  }

  const events = [...shipment.events].reverse();

  return (
    <div className="space-y-6">
      <Link href="/admin/colis" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("backShipments")}
      </Link>

      <PageTitle
        title={shipment.number}
        subtitle={`${shipment.origin} → ${shipment.destination} · ${label("mode_", shipment.mode)}`}
        actions={
          <>
            <ShipmentStatusBadge status={shipment.status} />
            <a
              href={`/shipping/suivi?numero=${encodeURIComponent(shipment.number)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-brand transition hover:border-brand/40"
            >
              <Icon name="globe" className="h-3.5 w-3.5" />
              {t("publicTracking")}
            </a>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Panel id="sh-events" title={t("eventsTitle")}>
            {events.length === 0 ? (
              <p className="text-sm text-muted">{t("noEvents")}</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-line pl-5">
                {events.map((ev, i) => (
                  <li key={ev.id} className="relative">
                    <span
                      className={`absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? "bg-brand" : "bg-silver"}`}
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{ev.label}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {dateTime(ev.at)}
                          {ev.location ? ` · ${ev.location}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShipmentStatusBadge status={ev.status} />
                        <button
                          type="button"
                          onClick={() => void removeEvent(ev.id)}
                          disabled={busy}
                          className="rounded-full px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                        >
                          {t("deleteEvent")}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel id="sh-add-event" title={t("addEventTitle")}>
            <form onSubmit={addEvent} className="grid gap-4 sm:grid-cols-2">
              <Field id="e-status" label={t("eStatus")}>
                <select
                  id="e-status"
                  value={eStatus}
                  onChange={(e) => {
                    const s = e.target.value as ShipmentStatus;
                    setEStatus(s);
                    if (!labelTouched) setELabel(label("lbl_", s));
                  }}
                  className={inputClass}
                >
                  {SHIPMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label("ss_", s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="e-at" label={t("eAt")}>
                <input id="e-at" type="datetime-local" value={eAt} onChange={(e) => setEAt(e.target.value)} className={inputClass} />
              </Field>
              <Field id="e-label" label={t("eLabel")} className="sm:col-span-2">
                <input
                  id="e-label"
                  required
                  minLength={2}
                  maxLength={200}
                  value={eLabel}
                  onChange={(e) => {
                    setELabel(e.target.value);
                    setLabelTouched(true);
                  }}
                  className={inputClass}
                />
              </Field>
              <Field id="e-location" label={t("eLocation")}>
                <input id="e-location" name="location" maxLength={160} className={inputClass} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-ink">
                <input type="checkbox" name="updateShipment" defaultChecked className="h-4 w-4 rounded border-line accent-[var(--color-brand)]" />
                {t("eUpdateStatus")}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={busy}>
                  <Icon name="check" className="h-4 w-4" />
                  {t("addEvent")}
                </Button>
              </div>
              {eventMsg && (
                <div className="sm:col-span-2">
                  <Message ok={eventMsg.ok}>{eventMsg.text}</Message>
                </div>
              )}
            </form>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel id="sh-info" title={t("editTitle")}>
            {/* key : réinitialise les champs quand les données serveur changent */}
            <form key={shipment.updatedAt} onSubmit={saveInfo} className="space-y-4">
              <Field id="i-status" label={t("statusLabel")}>
                <select id="i-status" name="status" defaultValue={shipment.status} className={inputClass}>
                  {SHIPMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label("ss_", s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="i-eta" label={t("fEta")}>
                <input id="i-eta" name="estimatedDelivery" type="date" defaultValue={shipment.estimatedDelivery ?? ""} className={inputClass} />
              </Field>
              <Field id="i-origin" label={t("fOrigin")}>
                <input id="i-origin" name="origin" required minLength={2} maxLength={120} defaultValue={shipment.origin} className={inputClass} />
              </Field>
              <Field id="i-destination" label={t("fDestination")}>
                <input id="i-destination" name="destination" required minLength={2} maxLength={120} defaultValue={shipment.destination} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="i-mode" label={t("fMode")}>
                  <select id="i-mode" name="mode" defaultValue={shipment.mode} className={inputClass}>
                    {SHIPPING_MODES.map((m) => (
                      <option key={m} value={m}>
                        {label("mode_", m)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="i-weight" label={t("fWeight")}>
                  <input
                    id="i-weight"
                    name="weightKg"
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={shipment.weightKg ?? ""}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field id="i-recipient" label={t("fRecipient")} hint={t("fRecipientHint")}>
                <input id="i-recipient" name="recipientName" maxLength={160} defaultValue={shipment.recipientName ?? ""} className={inputClass} />
              </Field>
              <Button type="submit" size="sm" className="w-full" disabled={busy}>
                {busy ? t("saving") : t("save")}
              </Button>
              {editMsg && <Message ok={editMsg.ok}>{editMsg.text}</Message>}
            </form>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("colEta")}</dt>
                <dd className="font-medium text-ink">{shipment.estimatedDelivery ? day(shipment.estimatedDelivery) : t("notSet")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("linkedRequest")}</dt>
                <dd className="font-medium">
                  {shipment.requestReference ? (
                    <Link href={`/admin/demandes/${shipment.requestReference}`} className="font-mono text-brand hover:underline">
                      {shipment.requestReference}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">{t("colUpdated")}</dt>
                <dd className="text-ink">{dateTime(shipment.updatedAt)}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

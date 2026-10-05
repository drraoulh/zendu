"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/layout";
import { Button, buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { translate } from "@/i18n/define";
import { adminPanelMessages } from "@/i18n/admin";
import { appName } from "@/lib/brand";
import { isLocale } from "@/lib/i18n";
import { REQUEST_STATUSES } from "@/lib/requests";
import type { AdminRequest, AdminShipment } from "../_server/data";
import {
  adminFetch,
  Field,
  inputClass,
  KIND_ICON,
  Message,
  PageTitle,
  Panel,
  RequestStatusBadge,
  ShipmentStatusBadge,
  useAdminT,
} from "./kit";

/** Ordre d'affichage des champs connus du payload, par type. */
const FIELDS: Record<string, string[]> = {
  contact: ["subject", "message"],
  shipping_quote: ["origin", "destination", "mode", "weightKg", "dimensionsCm", "content", "declaredValue", "pickup", "deliveryAddress"],
  finance_appointment: ["topic", "mode", "date", "time", "timezone", "note"],
  tech_project: ["projectTypes", "description", "budget", "timeline", "company", "website"],
};

const LONG = new Set(["message", "description", "note", "content", "deliveryAddress"]);

export function RequestDetail({ request }: { request: AdminRequest }) {
  const { t, label, dateTime, day, nl } = useAdminT();
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [note, setNote] = useState(request.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const p = request.payload;
  const known = FIELDS[request.kind] ?? [];
  const extra = Object.keys(p).filter((k) => !known.includes(k));

  function renderValue(key: string, v: unknown): ReactNode {
    if (v === undefined || v === null || v === "") return <span className="text-muted">—</span>;
    if (typeof v === "boolean") return v ? t("yes") : t("no");
    if (key === "subject" && request.kind === "contact" && typeof v === "string") return label("subj_", v);
    if (key === "mode" && typeof v === "string")
      return request.kind === "finance_appointment" ? label("am_", v) : label("mode_", v);
    if (key === "weightKg" && typeof v === "number") return `${new Intl.NumberFormat(nl).format(v)} kg`;
    if (key === "declaredValue" && typeof v === "number") return new Intl.NumberFormat(nl).format(v);
    if (key === "date" && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return day(v);
    if (key === "time" && typeof v === "string") return `${v} (${t("easternTime")})`;
    if (key === "dimensionsCm" && typeof v === "object" && v && !Array.isArray(v)) {
      const d = v as { length?: unknown; width?: unknown; height?: unknown };
      return `${d.length ?? "?"} × ${d.width ?? "?"} × ${d.height ?? "?"} cm`;
    }
    if (key === "dimensionsCm" && typeof v === "string") return `${v} cm`;
    if (Array.isArray(v))
      return (
        <span className="flex flex-wrap gap-1.5">
          {v.map((x, i) => (
            <Badge key={i} tone="brand">
              {String(x)}
            </Badge>
          ))}
        </span>
      );
    if (key === "website" && typeof v === "string") {
      const href = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-brand hover:underline">
          {v}
        </a>
      );
    }
    if (typeof v === "object") return <code className="break-all font-mono text-xs">{JSON.stringify(v)}</code>;
    return <span className={LONG.has(key) ? "whitespace-pre-wrap break-words" : "break-words"}>{String(v)}</span>;
  }

  const fieldLabel = (key: string) => {
    const k = `p_${key}`;
    return k in adminPanelMessages.fr ? label("p_", key) : key;
  };

  // Courriel pré-rempli dans la langue du client (fr par défaut).
  const mailLocale = isLocale(request.locale) && request.locale !== "fr" ? "en" : "fr";
  const vars = { ref: request.reference, name: request.name, brand: appName };
  const mailto = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(
    translate(adminPanelMessages, mailLocale, "mailSubject", vars),
  )}&body=${encodeURIComponent(translate(adminPanelMessages, mailLocale, "mailBody", vars))}`;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ warning?: string }>(`/api/admin/requests/${request.reference}`, "PATCH", {
        status,
        adminNote: note,
      });
      setMsg({ ok: true, text: res.warning === "slot_taken" ? t("slotTakenWarning") : t("saved") });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: t("saveError", { error: err instanceof Error ? err.message : "?" }) });
    } finally {
      setBusy(false);
    }
  }

  async function createShipment() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await adminFetch<{ shipment: AdminShipment }>("/api/admin/shipments", "POST", {
        requestReference: request.reference,
        initialLabel: t("initialEventLabel"),
      });
      router.push(`/admin/colis/${res.shipment.number}`);
    } catch (err) {
      setMsg({ ok: false, text: t("saveError", { error: err instanceof Error ? err.message : "?" }) });
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/demandes" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
        {t("backRequests")}
      </Link>

      <PageTitle
        title={request.reference}
        subtitle={`${label("kind_", request.kind)} · ${t("receivedOn", { date: dateTime(request.createdAt) })}`}
        actions={
          <>
            <RequestStatusBadge status={request.status} />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <Panel id="rq-contact" title={t("contactInfo")}>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-muted">{t("fieldName")}</dt>
                <dd className="mt-0.5 font-medium text-ink">{request.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-muted">{t("fieldEmail")}</dt>
                <dd className="mt-0.5 break-all">
                  <a href={`mailto:${request.email}`} className="font-medium text-brand hover:underline">
                    {request.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">{t("fieldPhone")}</dt>
                <dd className="mt-0.5 text-ink">
                  {request.phone ? (
                    <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`} className="text-brand hover:underline">
                      {request.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted">{t("fieldLocale")}</dt>
                <dd className="mt-0.5 uppercase text-ink">{request.locale ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={mailto} className={buttonClass("primary", "sm")}>
                <Icon name="mail" className="h-4 w-4" />
                {t("replyByEmail")}
              </a>
            </div>
          </Panel>

          <Panel
            id="rq-details"
            title={t("details")}
            actions={
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden>
                <Icon name={KIND_ICON[request.kind] ?? "info"} className="h-4 w-4" />
              </span>
            }
          >
            <dl className="divide-y divide-line text-sm">
              {[...known.filter((k) => k in p), ...extra].map((key) => (
                <div key={key} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-xs font-semibold text-muted sm:pt-0.5">{fieldLabel(key)}</dt>
                  <dd className="min-w-0 text-ink">{renderValue(key, p[key])}</dd>
                </div>
              ))}
            </dl>
            {request.kind === "finance_appointment" && (
              <p className="mt-4 rounded-xl bg-surface-soft px-3 py-2 text-xs text-muted">
                {request.slotKey ? t("slotReserved", { slot: request.slotKey.replace("T", " ") }) : t("slotFreed")}
              </p>
            )}
          </Panel>

          {request.kind === "shipping_quote" && (
            <Panel id="rq-shipments" title={t("linkedShipments")}>
              {request.shipments.length > 0 && (
                <ul className="mb-4 divide-y divide-line">
                  {request.shipments.map((s) => (
                    <li key={s.number} className="flex items-center justify-between gap-3 py-2.5">
                      <Link href={`/admin/colis/${s.number}`} className="font-mono text-sm font-semibold text-brand hover:underline">
                        {s.number}
                      </Link>
                      <ShipmentStatusBadge status={s.status} />
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" variant={request.shipments.length > 0 ? "secondary" : "primary"} disabled={busy} onClick={() => void createShipment()}>
                <Icon name="box" className="h-4 w-4" />
                {busy ? t("creating") : request.shipments.length > 0 ? t("createAnotherShipment") : t("createShipment")}
              </Button>
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel id="rq-manage" title={t("manage")}>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <Field id="rq-status" label={t("statusLabel")}>
                <select id="rq-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  {REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {label("rs_", s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="rq-note" label={t("noteLabel")} hint={t("noteHint")}>
                <textarea id="rq-note" rows={6} maxLength={5000} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
              </Field>
              <Button type="submit" size="sm" className="w-full" disabled={busy}>
                {busy ? t("saving") : t("save")}
              </Button>
              {msg && <Message ok={msg.ok}>{msg.text}</Message>}
            </form>
            <p className="mt-4 text-xs text-muted">{t("updatedOn", { date: dateTime(request.updatedAt) })}</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

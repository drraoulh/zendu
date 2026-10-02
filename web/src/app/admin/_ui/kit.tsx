"use client";

import { useCallback, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { adminPanelMessages, type AdminPanelKey } from "@/i18n/admin";

type Tone = "brand" | "success" | "warn" | "danger" | "neutral";

const NUMBER_LOCALE: Record<string, string> = { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" };

export const REQUEST_TONE: Record<string, Tone> = {
  new: "warn",
  in_progress: "brand",
  answered: "success",
  closed: "neutral",
};

export const SHIPMENT_TONE: Record<string, Tone> = {
  received: "neutral",
  in_transit: "brand",
  customs: "warn",
  out_for_delivery: "brand",
  delivered: "success",
  exception: "danger",
};

export const KIND_ICON: Record<string, IconName> = {
  contact: "mail",
  shipping_quote: "ship",
  finance_appointment: "finance",
  tech_project: "code",
};

/** Traductions + formats de date de l'espace équipe. */
export function useAdminT() {
  const t = useT(adminPanelMessages);
  const { locale } = useI18n();
  const nl = NUMBER_LOCALE[locale] ?? "fr-CA";
  /** Libellé traduit d'une clé dynamique ("kind_" + kind…), ou la valeur brute si inconnue. */
  const label = useCallback(
    (prefix: string, value: string) => {
      const key = `${prefix}${value}` as AdminPanelKey;
      return key in adminPanelMessages.fr ? t(key) : value;
    },
    [t],
  );
  const dateTime = useCallback(
    (iso: string) => new Intl.DateTimeFormat(nl, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)),
    [nl],
  );
  /** "YYYY-MM-DD" → date lisible (sans décalage de fuseau). */
  const day = useCallback(
    (ymd: string) =>
      new Intl.DateTimeFormat(nl, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`)),
    [nl],
  );
  return { t, label, dateTime, day, nl, locale };
}

export function RequestStatusBadge({ status }: { status: string }) {
  const { label } = useAdminT();
  return (
    <Badge tone={REQUEST_TONE[status] ?? "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label("rs_", status)}
    </Badge>
  );
}

export function ShipmentStatusBadge({ status }: { status: string }) {
  const { label } = useAdminT();
  return (
    <Badge tone={SHIPMENT_TONE[status] ?? "neutral"}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label("ss_", status)}
    </Badge>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function DbError() {
  const { t } = useAdminT();
  return (
    <div role="alert" className="rounded-3xl border border-danger/25 bg-white p-6 shadow-card sm:flex sm:items-start sm:gap-4">
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
  );
}

export function Panel({
  title,
  id,
  children,
  className = "",
  actions,
}: {
  title?: string;
  id?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section aria-labelledby={title ? id : undefined} className={`rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && (
            <h2 id={id} className="font-display text-base font-bold text-ink sm:text-lg">
              {title}
            </h2>
          )}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Message({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p
      role={ok ? "status" : "alert"}
      className={`rounded-xl px-3 py-2 text-sm font-medium ${ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
    >
      {children}
    </p>
  );
}

export const inputClass =
  "w-full min-w-0 rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20";

export const labelClass = "block text-xs font-semibold text-muted";

export function Field({
  id,
  label,
  hint,
  children,
  className = "",
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Appel JSON vers une API admin ; lève une Error avec le message serveur. */
export async function adminFetch<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { error?: unknown; issues?: { path: string; message: string }[] };
  if (!res.ok) {
    const detail = data.issues?.length ? ` (${data.issues.map((i) => i.path || i.message).join(", ")})` : "";
    throw new Error(`${typeof data.error === "string" ? data.error : res.status}${detail}`);
  }
  return data as T;
}

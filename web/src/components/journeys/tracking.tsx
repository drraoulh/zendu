"use client";

import Link from "next/link";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localeTag } from "@/components/app/country-name";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { trackingMessages } from "@/i18n/journeys";
import { ContactLink } from "./contact-link";
import { inputClass } from "./fields";
import { JourneyShell } from "./shell";

export const SHIPMENT_FLOW = ["received", "in_transit", "customs", "out_for_delivery", "delivered"] as const;
type FlowStatus = (typeof SHIPMENT_FLOW)[number];
type ShipmentStatus = FlowStatus | "exception";

type TrackEvent = { status: string; label?: string | null; location?: string | null; at: string };
type Shipment = {
  number: string;
  origin: string;
  destination: string;
  mode: string;
  status: string;
  weightKg?: number | null;
  estimatedDelivery?: string | null;
  events: TrackEvent[];
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; shipment: Shipment }
  | { kind: "not_found"; number: string }
  | { kind: "unavailable" }
  | { kind: "error" };

const STATUS_ICON: Record<ShipmentStatus, IconName> = {
  received: "box",
  in_transit: "plane",
  customs: "shield",
  out_for_delivery: "pin",
  delivered: "check",
  exception: "info",
};

/** "pws 04821", "PWS04821" ou "04821" → "PWS-04821" ; null si le format est invalide. */
export function normalizeTrackingNumber(input: string): string | null {
  const v = input.toUpperCase().replace(/\s+/g, "");
  const m = /^(?:PWS-?)?(\d{5})$/.exec(v);
  return m ? `PWS-${m[1]}` : null;
}

function isStatus(v: string): v is ShipmentStatus {
  return v === "exception" || (SHIPMENT_FLOW as readonly string[]).includes(v);
}

export function TrackingContent({ initialNumber = "" }: { initialNumber?: string }) {
  const t = useT(trackingMessages);
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const [input, setInput] = useState(initialNumber);
  const [formatError, setFormatError] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const lookup = useCallback(async (number: string, focusResult: boolean) => {
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setState({ kind: "loading" });
    try {
      const res = await fetch(`/api/shipments/track?number=${encodeURIComponent(number)}`, {
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (res.status === 404 || res.status === 400) {
        setState({ kind: "not_found", number });
      } else if (res.status === 503) {
        setState({ kind: "unavailable" });
      } else if (!res.ok) {
        setState({ kind: "error" });
      } else {
        const json = (await res.json()) as { shipment?: Shipment };
        if (json.shipment && typeof json.shipment.number === "string") {
          setState({
            kind: "found",
            shipment: { ...json.shipment, events: Array.isArray(json.shipment.events) ? json.shipment.events : [] },
          });
        } else setState({ kind: "not_found", number });
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setState({ kind: "error" });
    }
    if (focusResult) requestAnimationFrame(() => resultRef.current?.focus());
  }, []);

  // Numéro passé dans l'URL (?numero=PWS-12345) : recherche automatique.
  useEffect(() => {
    const n = normalizeTrackingNumber(initialNumber);
    if (n) {
      setInput(n);
      void lookup(n, false);
    } else if (initialNumber) {
      setFormatError(true);
    }
    return () => ctrlRef.current?.abort();
  }, [initialNumber, lookup]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = normalizeTrackingNumber(input);
    if (!n) {
      setFormatError(true);
      inputRef.current?.focus();
      return;
    }
    setFormatError(false);
    setInput(n);
    try {
      // Met à jour l'URL (partageable) sans relancer le rendu serveur.
      window.history.replaceState(null, "", `/shipping/suivi?numero=${encodeURIComponent(n)}`);
    } catch {
      /* ignore */
    }
    void lookup(n, true);
  }

  return (
    <JourneyShell
      back={{ href: "/shipping", label: t("back") }}
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      icon="box"
    >
      <div className="mx-auto grid max-w-3xl gap-6">
        <form
          noValidate
          onSubmit={onSubmit}
          role="search"
          className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8"
        >
          <label htmlFor="track-number" className="text-sm font-semibold text-ink">
            {t("numberLabel")}
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              id="track-number"
              name="numero"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="PWS-12345"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (formatError) setFormatError(false);
              }}
              aria-invalid={formatError || undefined}
              aria-describedby={formatError ? "track-number-error" : "track-number-hint"}
              className={`${inputClass} font-mono uppercase tracking-wider sm:flex-1`}
            />
            <button
              type="submit"
              disabled={state.kind === "loading"}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(11,77,255,0.7)] transition hover:bg-brand-strong disabled:opacity-60"
            >
              {state.kind === "loading" ? (
                <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Icon name="pin" className="h-4 w-4" />
              )}
              {t("search")}
            </button>
          </div>
          {formatError ? (
            <p id="track-number-error" role="alert" className="mt-2 text-xs font-medium text-danger">
              {t("errFormat")}
            </p>
          ) : (
            <p id="track-number-hint" className="mt-2 text-xs text-muted">
              {t("numberHint")}
            </p>
          )}
        </form>

        <div ref={resultRef} tabIndex={-1} aria-live="polite" className="focus:outline-none">
          {state.kind === "loading" && (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-card" aria-busy>
              <span className="sr-only">{t("loading")}</span>
              <div aria-hidden className="grid gap-3">
                <span className="h-5 w-40 animate-pulse rounded-full bg-surface-soft" />
                <span className="h-3 w-full animate-pulse rounded-full bg-surface-soft" />
                <span className="h-24 w-full animate-pulse rounded-2xl bg-surface-soft" />
              </div>
            </div>
          )}

          {state.kind === "idle" && (
            <EmptyCard icon="box" title={t("emptyTitle")} text={t("emptyText")} />
          )}

          {state.kind === "not_found" && (
            <EmptyCard
              icon="info"
              tone="warn"
              title={t("notFoundTitle", { number: state.number })}
              text={t("notFoundText")}
              contact
            />
          )}

          {state.kind === "unavailable" && (
            <EmptyCard icon="clock" tone="warn" title={t("unavailableTitle")} text={t("unavailableText")} contact />
          )}

          {state.kind === "error" && (
            <EmptyCard icon="info" tone="danger" title={t("errorTitle")} text={t("errorText")} contact />
          )}

          {state.kind === "found" && <ShipmentCard shipment={state.shipment} tag={tag} />}
        </div>

        <div className="flex flex-col items-start gap-3 rounded-3xl bg-surface-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-display text-sm font-bold text-ink">{t("noNumberTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("noNumberText")}</p>
          </div>
          <ButtonLink href="/shipping/devis" variant="secondary" size="sm" className="shrink-0">
            {t("quoteCta")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </JourneyShell>
  );
}

function EmptyCard({
  icon,
  title,
  text,
  tone = "brand",
  contact = false,
}: {
  icon: IconName;
  title: string;
  text: string;
  tone?: "brand" | "warn" | "danger";
  contact?: boolean;
}) {
  const t = useT(trackingMessages);
  const tones = {
    brand: "bg-brand-soft text-brand",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/10 text-danger",
  } as const;
  return (
    <div className="rounded-3xl border border-line bg-white p-6 text-center shadow-card sm:p-10">
      <span className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <h2 className="mt-5 break-words font-display text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{text}</p>
      {contact && (
        <p className="mt-4 text-sm text-muted">
          {t("contactPrompt")} <ContactLink subject="shipping" />
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string | null | undefined, tag: string, withTime: boolean): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    // Date seule (YYYY-MM-DD) : affichée telle quelle, sans décalage de fuseau.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
    return new Intl.DateTimeFormat(tag, {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(withTime && !dateOnly ? { hour: "2-digit", minute: "2-digit" } : {}),
      ...(dateOnly ? { timeZone: "UTC" } : {}),
    }).format(d);
  } catch {
    return iso;
  }
}

function ShipmentCard({ shipment, tag }: { shipment: Shipment; tag: string }) {
  const t = useT(trackingMessages);
  const status: ShipmentStatus = isStatus(shipment.status) ? shipment.status : "received";
  const exception = status === "exception";

  // Dernière étape normale atteinte (utile pour situer un incident dans le parcours).
  const reachedIndex = (() => {
    if (!exception) return SHIPMENT_FLOW.indexOf(status as FlowStatus);
    let idx = 0;
    for (const e of shipment.events) {
      const i = SHIPMENT_FLOW.indexOf(e.status as FlowStatus);
      if (i > idx) idx = i;
    }
    return idx;
  })();
  const pct = Math.round(((reachedIndex + 1) / SHIPMENT_FLOW.length) * 100);
  const events = [...shipment.events].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  const statusLabel = (s: string) => (isStatus(s) ? t(`status_${s}`) : s);
  const modeLabel = shipment.mode === "air" ? t("modeAir") : shipment.mode === "sea" ? t("modeSea") : shipment.mode;

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <header className="bg-navy-gradient relative p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky">{t("shipmentLabel")}</p>
            <h2 className="mt-1 font-mono text-xl font-bold tracking-wider sm:text-2xl">{shipment.number}</h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              exception ? "bg-warn text-navy" : status === "delivered" ? "bg-success text-white" : "bg-white/15 text-white"
            }`}
          >
            <Icon name={STATUS_ICON[status]} className="h-3.5 w-3.5" strokeWidth={2.4} />
            {statusLabel(status)}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">{t("from")}</p>
            <p className="mt-0.5 break-words text-sm font-semibold sm:text-base">{shipment.origin}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sky" aria-hidden>
            <Icon name={shipment.mode === "sea" ? "ship" : "plane"} className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-right">
            <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/60">{t("to")}</p>
            <p className="mt-0.5 break-words text-sm font-semibold sm:text-base">{shipment.destination}</p>
          </div>
        </div>
      </header>

      <div className="p-5 sm:p-7">
        {/* Progression */}
        <div
          role="progressbar"
          aria-label={t("progressLabel")}
          aria-valuemin={1}
          aria-valuemax={SHIPMENT_FLOW.length}
          aria-valuenow={reachedIndex + 1}
          aria-valuetext={statusLabel(status)}
          className="h-2 overflow-hidden rounded-full bg-surface-soft"
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${exception ? "bg-warn" : "bg-brand-gradient"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-1 text-center">
          {SHIPMENT_FLOW.map((s, i) => {
            const done = i <= reachedIndex;
            return (
              <li key={s} className="flex flex-col items-center gap-1.5">
                <span
                  className={`grid h-8 w-8 place-items-center rounded-full ${
                    done ? (exception && i === reachedIndex ? "bg-warn text-white" : "bg-brand text-white") : "bg-surface-soft text-muted"
                  }`}
                >
                  <Icon name={STATUS_ICON[s]} className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className={`text-[0.62rem] font-semibold leading-tight sm:text-xs ${done ? "text-ink" : "text-muted"}`}>
                  {t(`status_${s}`)}
                </span>
              </li>
            );
          })}
        </ol>

        {exception && (
          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-warn/10 px-4 py-3 text-sm text-ink">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
            <span>
              {t("exceptionText")} <ContactLink subject="shipping" />
            </span>
          </p>
        )}

        <dl className="mt-6 grid gap-3 rounded-2xl bg-surface-soft p-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">{t("mode")}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">{modeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("weight")}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {typeof shipment.weightKg === "number" ? `${shipment.weightKg.toLocaleString(tag)} kg` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">{t("eta")}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {status === "delivered"
                ? t("etaDelivered")
                : shipment.estimatedDelivery
                  ? formatDate(shipment.estimatedDelivery, tag, false)
                  : t("etaUnknown")}
            </dd>
          </div>
        </dl>
        {shipment.estimatedDelivery && status !== "delivered" && (
          <p className="mt-2 text-xs text-muted">{t("etaNote")}</p>
        )}

        {/* Chronologie */}
        <h3 className="mt-8 font-display text-base font-bold text-ink">{t("timelineTitle")}</h3>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("noEvents")}</p>
        ) : (
          <ol className="mt-4 grid gap-0">
            {events.map((e, i) => {
              const s: ShipmentStatus = isStatus(e.status) ? e.status : "received";
              const latest = i === 0;
              return (
                <li key={`${e.at}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < events.length - 1 && (
                    <span aria-hidden className="absolute left-[0.9rem] top-8 h-[calc(100%-2rem)] w-px bg-line" />
                  )}
                  <span
                    className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white ${
                      latest ? (s === "exception" ? "bg-warn text-white" : "bg-brand text-white") : "bg-surface-soft text-muted"
                    }`}
                  >
                    <Icon name={STATUS_ICON[s]} className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${latest ? "text-ink" : "text-ink/80"}`}>
                      {e.label?.trim() || statusLabel(e.status)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <time dateTime={e.at}>{formatDate(e.at, tag, true)}</time>
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <p className="mt-8 border-t border-line pt-5 text-sm text-muted">
          {t("questions")}{" "}
          <Link href="/contact?sujet=shipping" className="font-semibold text-brand hover:text-brand-strong">
            {t("contactLink")}
          </Link>
        </p>
      </div>
    </article>
  );
}

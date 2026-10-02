"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localeTag } from "@/components/app/country-name";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { thanksMessages } from "@/i18n/journeys";
import { ContactLink } from "./contact-link";
import { inputClass } from "./fields";
import { EMAIL_RE, LAST_REQUEST_KEY, type LastRequest, type RequestKind, readSession } from "./submit";

const KINDS: RequestKind[] = ["contact", "shipping_quote", "finance_appointment", "tech_project"];
const PREFIX: Record<string, RequestKind> = {
  CT: "contact",
  SHQ: "shipping_quote",
  FIN: "finance_appointment",
  TECH: "tech_project",
};
const KIND_ICON: Record<RequestKind | "generic", IconName> = {
  contact: "mail",
  shipping_quote: "box",
  finance_appointment: "finance",
  tech_project: "code",
  generic: "check",
};
const STATUSES = ["new", "in_progress", "answered", "closed"] as const;
type Status = (typeof STATUSES)[number];

/** Référence au format attendu (CT-XXXXXX, SHQ-…, FIN-…, TECH-…), normalisée ; sinon null. */
export function normalizeRef(input: string | undefined | null): string | null {
  if (!input) return null;
  const m = /^(CT|SHQ|FIN|TECH)-?([A-Z0-9]{4,12})$/.exec(input.toUpperCase().replace(/\s+/g, ""));
  return m ? `${m[1]}-${m[2]}` : null;
}

type Check =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; status: string; createdAt?: string }
  | { kind: "not_found" }
  | { kind: "unavailable" }
  | { kind: "error" };

export function ThankYouContent({ reference: rawRef, kind: rawKind }: { reference?: string; kind?: string }) {
  const t = useT(thanksMessages);
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const reference = normalizeRef(rawRef);
  const kind: RequestKind | "generic" =
    rawKind && (KINDS as string[]).includes(rawKind)
      ? (rawKind as RequestKind)
      : reference
        ? (PREFIX[reference.split("-")[0]] ?? "generic")
        : "generic";
  const k = kind === "generic" ? "generic" : kind;

  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [check, setCheck] = useState<Check>({ kind: "idle" });

  // Pré-remplit le courriel si la demande vient d'être envoyée depuis cet onglet.
  useEffect(() => {
    const last = readSession<LastRequest>(LAST_REQUEST_KEY);
    if (last && reference && last.reference === reference && typeof last.email === "string") setEmail(last.email);
  }, [reference]);

  async function copy() {
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  }

  async function onCheck(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reference) return;
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(true);
      document.getElementById("status-email")?.focus();
      return;
    }
    setEmailError(false);
    setCheck({ kind: "loading" });
    try {
      const res = await fetch(
        `/api/requests/${encodeURIComponent(reference)}?email=${encodeURIComponent(email.trim())}`,
        { cache: "no-store" },
      );
      if (res.status === 404 || res.status === 403 || res.status === 400) return setCheck({ kind: "not_found" });
      if (res.status === 503) return setCheck({ kind: "unavailable" });
      if (!res.ok) return setCheck({ kind: "error" });
      const json = (await res.json()) as { status?: string; createdAt?: string };
      setCheck({ kind: "found", status: json.status ?? "new", createdAt: json.createdAt });
    } catch {
      setCheck({ kind: "error" });
    }
  }

  const statusLabel = (s: string) => ((STATUSES as readonly string[]).includes(s) ? t(`status_${s as Status}`) : s);
  const statusText = (s: string) =>
    (STATUSES as readonly string[]).includes(s) ? t(`statusText_${s as Status}`) : "";

  const steps = [t(`${k}_next1`), t(`${k}_next2`), t(`${k}_next3`)];

  return (
    <>
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative pb-28 pt-12 text-center sm:pb-32 sm:pt-16">
          <span className="bg-brand-gradient animate-rise mx-auto grid h-16 w-16 place-items-center rounded-full shadow-float ring-4 ring-white/15">
            <Icon name="check" className="h-8 w-8 text-white" strokeWidth={2.6} />
          </span>
          <p className="mt-6 font-display text-xs font-bold uppercase tracking-[0.18em] text-sky">
            {t(`${k}_eyebrow`)}
          </p>
          <h1 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {t(`${k}_title`)}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/75">{t(`${k}_text`)}</p>
        </Container>
      </section>

      <Container className="relative -mt-20 pb-16 sm:pb-24">
        <div className="mx-auto grid max-w-3xl gap-6">
          {/* Référence */}
          <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
            {reference ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{t("refLabel")}</p>
                  <p className="mt-1 break-all font-mono text-2xl font-bold tracking-wider text-ink sm:text-3xl">
                    {reference}
                  </p>
                  <p className="mt-1 text-xs text-muted">{t("refHint")}</p>
                </div>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand/40 hover:text-brand-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                >
                  <Icon name={copied === "ok" ? "check" : "receipt"} className="h-4 w-4" />
                  {copied === "ok" ? t("copied") : t("copy")}
                </button>
                <span className="sr-only" aria-live="polite">
                  {copied === "ok" ? t("copied") : copied === "fail" ? t("copyFailed") : ""}
                </span>
              </div>
            ) : (
              <p className="flex items-start gap-2 text-sm text-muted">
                <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {t("noRef")}
              </p>
            )}
            {copied === "fail" && <p className="mt-3 text-xs text-muted">{t("copyFailed")}</p>}

            {/* Prochaines étapes */}
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <Icon name={KIND_ICON[kind]} className="h-5 w-5 text-brand" />
                {t("nextTitle")}
              </h2>
              <ol className="mt-4 grid gap-3">
                {steps.map((s, i) => (
                  <li key={s} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-sm text-ink">
                <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {t("delay")}
              </p>
            </div>
          </div>

          {/* Vérifier le statut */}
          {reference && (
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
              <h2 className="font-display text-lg font-bold text-ink">{t("checkTitle")}</h2>
              <p className="mt-1 text-sm text-muted">{t("checkText")}</p>
              <form noValidate onSubmit={onCheck} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <label htmlFor="status-email" className="sr-only">
                    {t("emailLabel")}
                  </label>
                  <input
                    id="status-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t("emailLabel")}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(false);
                    }}
                    aria-invalid={emailError || undefined}
                    aria-describedby={emailError ? "status-email-error" : undefined}
                    className={inputClass}
                  />
                  {emailError && (
                    <p id="status-email-error" role="alert" className="mt-1.5 text-xs font-medium text-danger">
                      {t("errEmail")}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={check.kind === "loading"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60"
                >
                  {check.kind === "loading" && (
                    <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {t("checkCta")}
                </button>
              </form>

              <div aria-live="polite" className="mt-4 empty:hidden">
                {check.kind === "found" && (
                  <div className="flex items-start gap-3 rounded-2xl bg-brand-soft/60 px-4 py-3">
                    <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <div className="text-sm">
                      <p className="font-semibold text-ink">
                        {t("statusIs")}{" "}
                        <span className="rounded-full bg-white px-2 py-0.5 text-brand-strong">{statusLabel(check.status)}</span>
                      </p>
                      {statusText(check.status) && <p className="mt-1 text-muted">{statusText(check.status)}</p>}
                      {check.createdAt && !Number.isNaN(new Date(check.createdAt).getTime()) && (
                        <p className="mt-1 text-xs text-muted">
                          {t("createdAt", {
                            date: new Intl.DateTimeFormat(tag, { dateStyle: "long", timeStyle: "short" }).format(
                              new Date(check.createdAt),
                            ),
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {check.kind === "not_found" && (
                  <p className="rounded-2xl bg-warn/10 px-4 py-3 text-sm text-ink">{t("checkNotFound")}</p>
                )}
                {check.kind === "unavailable" && (
                  <p className="rounded-2xl bg-warn/10 px-4 py-3 text-sm text-ink">{t("checkUnavailable")}</p>
                )}
                {check.kind === "error" && (
                  <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{t("checkError")}</p>
                )}
              </div>
            </div>
          )}

          {/* Liens utiles */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { href: "/", icon: "star" as const, title: t("linkHome"), text: t("linkHomeText") },
              { href: "/aide", icon: "info" as const, title: t("linkHelp"), text: t("linkHelpText") },
              { href: "/transfert", icon: "transfer" as const, title: t("linkWst"), text: t("linkWstText") },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon name={l.icon} className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-sm font-bold text-ink">{l.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{l.text}</p>
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 text-center text-sm text-muted">
            <p>
              {t("questions")} <ContactLink />
            </p>
            {kind === "shipping_quote" && (
              <ButtonLink href="/shipping/suivi" variant="ghost" size="sm">
                <Icon name="pin" className="h-4 w-4" />
                {t("trackCta")}
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}

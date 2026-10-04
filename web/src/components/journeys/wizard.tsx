"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { wizardMessages } from "@/i18n/journeys";
import { ContactLink } from "./contact-link";
import { Honeypot } from "./fields";
import {
  LAST_REQUEST_KEY,
  type Issue,
  type LastRequest,
  type RequestKind,
  readSession,
  removeSession,
  submitRequest,
  writeSession,
} from "./submit";

/* -------------------------------------------------------------------------- */
/* Types publics du kit                                                        */
/* -------------------------------------------------------------------------- */

export type FieldErrors = Partial<Record<string, string>>;

export type StepContext<V> = {
  values: V;
  set: <K extends keyof V>(key: K, value: V[K]) => void;
  errors: FieldErrors;
  /** Identifiant DOM d'un champ (utilisé pour le focus du premier champ en erreur). */
  fieldId: (name: string) => string;
};

export type WizardStep<V> = {
  key: string;
  /** Libellé court dans le stepper. */
  label: string;
  /** Titre affiché au-dessus des champs. */
  title: string;
  description?: string;
  /** Champs de l'étape : sert à rouvrir la bonne étape quand le serveur signale une erreur. */
  fields?: string[];
  /** Erreurs par champ, dans l'ordre d'affichage (le premier reçoit le focus). */
  validate?: (values: V) => FieldErrors;
  render: (ctx: StepContext<V>) => ReactNode;
};

export type SummaryRow = { label: string; value: string };
export type SummarySection = { title: string; step: number; rows: SummaryRow[] };

export type RequestParts = {
  name: string;
  email: string;
  phone?: string;
  payload: Record<string, unknown>;
};

type Status = "idle" | "sending" | "invalid" | "conflict" | "rate_limited" | "unavailable" | "error";

type Draft<V> = { v: 1; step: number; maxStep: number; values: Partial<V> };

/** Fusionne un brouillon avec les valeurs initiales en ne gardant que les clés connues et du bon type. */
function mergeDraft<V extends object>(initial: V, draft: Partial<V> | undefined): V {
  const out = { ...initial };
  if (!draft || typeof draft !== "object") return out;
  for (const key of Object.keys(initial) as (keyof V)[]) {
    const incoming = draft[key];
    const base = initial[key];
    if (incoming === undefined) continue;
    if (Array.isArray(base)) {
      if (Array.isArray(incoming)) out[key] = incoming.filter((x) => typeof x === "string") as V[keyof V];
    } else if (typeof incoming === typeof base) {
      out[key] = incoming as V[keyof V];
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                     */
/* -------------------------------------------------------------------------- */

export function Stepper({
  labels,
  current,
  maxReached,
  onSelect,
}: {
  labels: string[];
  current: number;
  maxReached: number;
  onSelect: (index: number) => void;
}) {
  const t = useT(wizardMessages);
  const total = labels.length;
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <nav aria-label={t("progressLabel")}>
      {/* Mobile : résumé + barre */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-semibold text-ink">{labels[current]}</span>
          <span className="shrink-0 text-xs font-semibold text-muted">
            {t("stepOf", { n: current + 1, total })}
          </span>
        </div>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-soft sm:hidden"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={t("stepOf", { n: current + 1, total })}
      >
        <div className="bg-brand-gradient h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Tablette et plus : liste des étapes */}
      <ol className="hidden items-center gap-2 sm:flex">
        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const reachable = i <= maxReached && !active;
          const bubble = (
            <>
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black transition ${
                  active
                    ? "bg-brand-gradient text-white shadow-[0_6px_16px_-6px_rgba(11,77,255,0.8)]"
                    : done
                      ? "bg-brand text-white"
                      : "border border-line bg-white text-muted"
                }`}
              >
                {done ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={`hidden truncate text-xs font-semibold lg:inline ${active ? "text-ink" : "text-muted"}`}
              >
                {label}
              </span>
            </>
          );
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(i)}
                  className="flex min-w-0 items-center gap-2 rounded-full pr-1 hover:opacity-80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                  aria-label={`${t("goToStep", { n: i + 1 })} : ${label}`}
                >
                  {bubble}
                </button>
              ) : (
                <span className="flex min-w-0 items-center gap-2">
                  {bubble}
                  <span className="sr-only">
                    {t("stepOf", { n: i + 1, total })} : {label}
                  </span>
                </span>
              )}
              {i < total - 1 && (
                <span
                  aria-hidden
                  className={`h-0.5 min-w-3 flex-1 rounded-full ${i < current ? "bg-brand" : "bg-line"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Récapitulatif                                                               */
/* -------------------------------------------------------------------------- */

export function Summary({ sections, onEdit }: { sections: SummarySection[]; onEdit: (step: number) => void }) {
  const t = useT(wizardMessages);
  return (
    <div className="grid gap-4">
      {sections.map((s) => (
        <section key={s.title} className="rounded-2xl border border-line bg-surface-soft/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-bold text-ink">{s.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(s.step)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {t("edit")}
              <span className="sr-only"> : {s.title}</span>
            </button>
          </div>
          <dl className="mt-3 grid gap-2.5">
            {s.rows
              .filter((r) => r.value.trim() !== "")
              .map((r) => (
                <div key={r.label} className="grid gap-0.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
                  <dt className="text-xs font-medium text-muted">{r.label}</dt>
                  <dd className="whitespace-pre-line break-words text-sm font-medium text-ink">{r.value}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Assistant multi-étapes                                                      */
/* -------------------------------------------------------------------------- */

export function Wizard<V extends object>({
  id,
  kind,
  initial,
  steps,
  summary,
  toRequest,
  issueField,
  conflict,
  reviewIntro,
}: {
  /** Préfixe des identifiants DOM et de la clé de brouillon. */
  id: string;
  kind: RequestKind;
  initial: V;
  steps: WizardStep<V>[];
  summary: (values: V) => SummarySection[];
  toRequest: (values: V) => RequestParts;
  /** Associe un chemin d'erreur serveur (`["payload","weightKg"]`) à un champ du formulaire. */
  issueField?: (path: string[]) => string | undefined;
  /** Réponse 409 (ex. créneau déjà pris) : champ à réinitialiser et message à afficher. */
  conflict?: { field: keyof V & string; message: string };
  reviewIntro?: string;
}) {
  const t = useT(wizardMessages);
  const { locale } = useI18n();
  const router = useRouter();
  const storageKey = `pwf:journey:${id}`;

  const [values, setValues] = useState<V>(initial);
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [restored, setRestored] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [announce, setAnnounce] = useState("");

  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const focusTarget = useRef<"heading" | string | null>(null);

  const total = steps.length + 1; // + récapitulatif
  const isReview = step === steps.length;
  const labels = [...steps.map((s) => s.label), t("reviewLabel")];
  const fieldId = useCallback((name: string) => `${id}-${name}`, [id]);

  /* Brouillon : lecture au montage, puis sauvegarde à chaque modification. */
  useEffect(() => {
    const draft = readSession<Draft<V>>(storageKey);
    if (draft && draft.v === 1 && draft.values) {
      const merged = mergeDraft(initial, draft.values);
      const changed = JSON.stringify(merged) !== JSON.stringify(initial);
      setValues(merged);
      const max = Math.min(Math.max(0, Number(draft.maxStep) || 0), steps.length);
      setMaxStep(max);
      setStep(Math.min(Math.max(0, Number(draft.step) || 0), max));
      if (changed) setRestored(true);
    }
    setHydrated(true);
    // Lecture unique au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeSession(storageKey, { v: 1, step, maxStep, values } satisfies Draft<V>);
  }, [hydrated, storageKey, step, maxStep, values]);

  /* Focus après changement d'étape ou de validation. */
  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = null;
    if (target === "heading") {
      headingRef.current?.focus();
      return;
    }
    const el = document.getElementById(target);
    if (el) {
      if (el.tabIndex < 0 && !/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) el.tabIndex = -1;
      el.focus();
      el.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }
  });

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key as string] ? { ...e, [key as string]: undefined } : e));
    setStatus((s) => (s === "invalid" || s === "conflict" ? "idle" : s));
  }, []);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, total - 1));
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
    setErrors({});
    if (status !== "sending") setStatus("idle");
    focusTarget.current = "heading";
    const title = next === steps.length ? t("reviewTitle") : steps[next].title;
    setAnnounce(t("announceStep", { n: next + 1, total, title }));
  }

  function validateStep(index: number): FieldErrors {
    const fn = steps[index]?.validate;
    if (!fn) return {};
    const found = fn(values);
    return Object.fromEntries(Object.entries(found).filter(([, v]) => Boolean(v)));
  }

  function showErrors(found: FieldErrors) {
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) focusTarget.current = fieldId(first);
    const count = Object.keys(found).length;
    setAnnounce(count === 1 ? t("announceOneError") : t("announceErrors", { count }));
  }

  function next() {
    const found = validateStep(step);
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    goTo(step + 1);
  }

  function mapIssues(issues: Issue[]): FieldErrors {
    const out: FieldErrors = {};
    for (const issue of issues) {
      const field = issueField?.(issue.path) ?? issue.path[issue.path.length - 1];
      if (field && !out[field]) out[field] = t("serverFieldError");
    }
    return out;
  }

  async function submit() {
    // Revalidation complète avant envoi (brouillon restauré, étapes sautées…).
    for (let i = 0; i < steps.length; i++) {
      const found = validateStep(i);
      if (Object.keys(found).length > 0) {
        setStep(i);
        showErrors(found);
        return;
      }
    }

    setStatus("sending");
    setAnnounce(t("sending"));
    const parts = toRequest(values);
    const result = await submitRequest({
      kind,
      name: parts.name.trim(),
      email: parts.email.trim(),
      phone: parts.phone?.trim() || undefined,
      locale,
      website: honeypot,
      payload: parts.payload,
    });

    if (result.ok) {
      removeSession(storageKey);
      writeSession(LAST_REQUEST_KEY, {
        reference: result.reference,
        kind,
        email: parts.email.trim(),
      } satisfies LastRequest);
      setAnnounce(t("sent"));
      router.push(`/merci?ref=${encodeURIComponent(result.reference)}&kind=${kind}`);
      return;
    }

    if (result.reason === "invalid") {
      const mapped = mapIssues(result.issues);
      const firstField = Object.keys(mapped)[0];
      const stepIndex = firstField ? steps.findIndex((s) => s.fields?.includes(firstField)) : -1;
      setStatus("invalid");
      if (stepIndex >= 0) {
        setStep(stepIndex);
        setErrors(mapped);
        focusTarget.current = fieldId(firstField!);
      }
      setAnnounce(t("errInvalid"));
      return;
    }
    if (result.reason === "conflict" && conflict) {
      const stepIndex = steps.findIndex((s) => s.fields?.includes(conflict.field));
      setValues((v) => ({ ...v, [conflict.field]: initial[conflict.field] }));
      setStatus("conflict");
      if (stepIndex >= 0) {
        setStep(stepIndex);
        setErrors({ [conflict.field]: conflict.message });
        focusTarget.current = "heading";
      }
      setAnnounce(conflict.message);
      return;
    }
    const reason = result.reason === "conflict" ? "error" : result.reason;
    setStatus(reason);
    setAnnounce(
      reason === "unavailable" ? t("errUnavailable") : reason === "rate_limited" ? t("errRateLimited") : t("errGeneric"),
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    if (isReview) void submit();
    else next();
  }

  function clearDraft() {
    removeSession(storageKey);
    setValues(initial);
    setErrors({});
    setStep(0);
    setMaxStep(0);
    setRestored(false);
    setStatus("idle");
    focusTarget.current = "heading";
  }

  const current = isReview ? null : steps[step];
  const hasErrors = Object.values(errors).some(Boolean);
  const sending = status === "sending";

  const statusMessage =
    status === "invalid"
      ? t("errInvalid")
      : status === "conflict"
        ? (conflict?.message ?? t("errGeneric"))
        : status === "unavailable"
          ? t("errUnavailable")
          : status === "rate_limited"
            ? t("errRateLimited")
            : status === "error"
              ? t("errGeneric")
              : null;

  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-card min-[360px]:p-5 sm:p-8">
      <Stepper labels={labels} current={step} maxReached={maxStep} onSelect={goTo} />

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>

      {restored && (
        <div className="mt-6 flex flex-col gap-2 rounded-2xl bg-brand-soft/70 px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-start gap-2">
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {t("draftRestored")}
          </span>
          <button
            type="button"
            onClick={clearDraft}
            className="self-start rounded-full px-3 py-1 text-xs font-semibold text-brand hover:bg-white sm:self-auto"
          >
            {t("draftClear")}
          </button>
        </div>
      )}

      <form ref={formRef} noValidate onSubmit={onSubmit} className="relative mt-6" aria-busy={sending || undefined}>
        <Honeypot value={honeypot} onChange={setHoneypot} />

        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
            {t("stepOf", { n: step + 1, total })}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-ink focus:outline-none sm:text-[1.7rem]"
          >
            {current ? current.title : t("reviewTitle")}
          </h2>
          {(current?.description || (isReview && (reviewIntro || t("reviewIntro")))) && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {current ? current.description : reviewIntro || t("reviewIntro")}
            </p>
          )}
        </div>

        {hasErrors && (
          <p role="alert" className="mb-5 flex items-start gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
            {t("errSummary")}
          </p>
        )}

        <div key={step} className="animate-rise grid gap-5">
          {current ? (
            current.render({ values, set, errors, fieldId })
          ) : (
            <>
              <Summary sections={summary(values)} onEdit={goTo} />
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                <Icon name="lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {t("privacyNote")}
              </p>
            </>
          )}
        </div>

        {statusMessage && (
          <div
            role="alert"
            className={`mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
              status === "unavailable" || status === "rate_limited" || status === "conflict"
                ? "bg-warn/10 text-ink"
                : "bg-danger/10 text-danger"
            }`}
          >
            <Icon
              name="info"
              className={`mt-0.5 h-5 w-5 shrink-0 ${status === "error" || status === "invalid" ? "text-danger" : "text-warn"}`}
            />
            <div>
              <p className="font-semibold">{statusMessage}</p>
              {status === "unavailable" && (
                <p className="mt-1 text-muted">
                  {t("draftKept")}{" "}
                  <ContactLink />
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={sending}>
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              {t("back")}
            </Button>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={sending}>
            {sending ? (
              <>
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                {t("sending")}
              </>
            ) : isReview ? (
              <>
                <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                {status === "unavailable" || status === "error" || status === "rate_limited" ? t("retry") : t("submit")}
              </>
            ) : (
              <>
                {t("next")}
                <Icon name="arrowRight" className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

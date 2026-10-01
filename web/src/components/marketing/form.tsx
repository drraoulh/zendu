import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export const inputClass =
  "block w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 shadow-sm transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15 sm:text-sm";

/** Champ de formulaire étiqueté, avec message d'erreur accessible. */
export function Field({
  id,
  label,
  error,
  hint,
  required = false,
  optionalLabel,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  optionalLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-semibold text-ink">
        <span>
          {label}
          {required && (
            <span className="ml-0.5 text-brand" aria-hidden>
              *
            </span>
          )}
        </span>
        {!required && optionalLabel && <span className="text-xs font-normal text-muted">{optionalLabel}</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Propriétés ARIA à étaler sur un input lié à un <Field>. */
export function fieldAria(id: string, error?: string, hint?: string) {
  return {
    id,
    name: id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Construit un lien mailto: correctement encodé. */
export function buildMailto(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Ouvre le client de messagerie de l'utilisateur. */
export function openMailto(href: string) {
  window.location.href = href;
}

/** Formate des lignes « Libellé : valeur » en ignorant les valeurs vides. */
export function formatLines(rows: Array<[string, string]>): string {
  return rows
    .filter(([, value]) => value.trim() !== "")
    .map(([label, value]) => `${label} : ${value.trim()}`)
    .join("\n");
}

export function FormSuccess({
  title,
  text,
  mailtoHref,
  retryLabel,
  resetLabel,
  onReset,
}: {
  title: string;
  text: string;
  mailtoHref: string;
  retryLabel: string;
  resetLabel: string;
  onReset: () => void;
}) {
  return (
    <div role="status" className="rounded-3xl border border-success/30 bg-success/5 p-6 text-center sm:p-8">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success text-white">
        <Icon name="check" className="h-7 w-7" strokeWidth={2.6} />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{text}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href={mailtoHref}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          <Icon name="mail" className="h-4 w-4" />
          {retryLabel}
        </a>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-soft"
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}

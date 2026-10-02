"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { wizardMessages } from "@/i18n/journeys";

export const inputClass =
  "block w-full min-w-0 rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 shadow-sm transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15 sm:text-sm";

function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-danger">
      <Icon name="info" className="mt-px h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  );
}

function HintText({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  if (!hint || error) return null;
  return (
    <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
      {hint}
    </p>
  );
}

function LabelRow({
  htmlFor,
  label,
  required,
  as = "label",
  plain = false,
}: {
  htmlFor?: string;
  label: string;
  required?: boolean;
  as?: "label" | "legend";
  /** Sans astérisque ni mention « Facultatif » (sous-champ d'un groupe). */
  plain?: boolean;
}) {
  const t = useT(wizardMessages);
  const inner = (
    <>
      <span>
        {label}
        {required && !plain && (
          <span className="ml-0.5 text-brand" aria-hidden>
            *
          </span>
        )}
      </span>
      {!required && !plain && <span className="text-xs font-normal text-muted">{t("optional")}</span>}
    </>
  );
  const cls = "mb-1.5 flex w-full items-baseline justify-between gap-2 text-sm font-semibold text-ink";
  if (as === "legend") return <legend className={cls}>{inner}</legend>;
  return (
    <label htmlFor={htmlFor} className={cls}>
      {inner}
    </label>
  );
}

type BaseProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
};

export function TextInput({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
  list,
  suffix,
  plain,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "url" | "number";
  inputMode?: "text" | "decimal" | "numeric" | "email" | "tel" | "url";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
  list?: string;
  suffix?: string;
  plain?: boolean;
}) {
  return (
    <div className={className}>
      <LabelRow htmlFor={id} label={label} required={required} plain={plain} />
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          list={list}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${inputClass} ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-muted">
            {suffix}
          </span>
        )}
      </div>
      <HintText id={id} hint={hint} error={error} />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className={className}>
      <LabelRow htmlFor={id} label={label} required={required} />
      <textarea
        id={id}
        name={id}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${inputClass} resize-y`}
      />
      {maxLength && (
        <p className="mt-1 text-right text-[0.7rem] text-muted" aria-hidden>
          {value.length} / {maxLength}
        </p>
      )}
      <HintText id={id} hint={hint} error={error} />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export function SelectInput({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  value,
  onChange,
  options,
  placeholder,
}: BaseProps & {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <LabelRow htmlFor={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${inputClass} appearance-none pr-10`}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </div>
      <HintText id={id} hint={hint} error={error} />
      <ErrorText id={id} error={error} />
    </div>
  );
}

export type ChoiceOption = { value: string; label: string; description?: string; icon?: IconName; extra?: ReactNode };

/**
 * Groupe de cartes à choix (radio ou cases à cocher). Le premier contrôle porte `id`
 * pour que le focus « premier champ en erreur » fonctionne.
 */
function ChoiceCards({
  id,
  label,
  error,
  hint,
  required,
  className = "",
  options,
  isChecked,
  onToggle,
  multiple,
  columns = 2,
}: BaseProps & {
  options: ChoiceOption[];
  isChecked: (value: string) => boolean;
  onToggle: (value: string) => void;
  multiple: boolean;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 1 ? "" : columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <fieldset
      className={`min-w-0 ${className}`}
      aria-describedby={describedBy(id, error, hint)}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
    >
      <LabelRow as="legend" label={label} required={required} />
      <div className={`grid gap-3 ${cols}`}>
        {options.map((o, i) => {
          const checked = isChecked(o.value);
          return (
            <label
              key={o.value}
              className={`group relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
                checked
                  ? "border-brand bg-brand-soft/70 shadow-[0_0_0_1px_var(--color-brand)]"
                  : error
                    ? "border-danger/50 bg-white hover:border-brand/40"
                    : "border-line bg-white hover:border-brand/40"
              }`}
            >
              <input
                id={i === 0 ? id : `${id}-${o.value}`}
                type={multiple ? "checkbox" : "radio"}
                name={id}
                value={o.value}
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="sr-only"
              />
              {o.icon && (
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                    checked ? "bg-brand text-white" : "bg-surface-soft text-brand"
                  }`}
                >
                  <Icon name={o.icon} className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{o.description}</span>}
                {o.extra}
              </span>
              <span
                aria-hidden
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border-2 transition ${
                  multiple ? "rounded-md" : "rounded-full"
                } ${checked ? "border-brand bg-brand text-white" : "border-line bg-white text-transparent"}`}
              >
                <Icon name="check" className="h-3 w-3" strokeWidth={3} />
              </span>
            </label>
          );
        })}
      </div>
      <HintText id={id} hint={hint} error={error} />
      <ErrorText id={id} error={error} />
    </fieldset>
  );
}

export function RadioCards(
  props: BaseProps & {
    options: ChoiceOption[];
    value: string;
    onChange: (value: string) => void;
    columns?: 1 | 2 | 3;
  },
) {
  const { value, onChange, ...rest } = props;
  return <ChoiceCards {...rest} multiple={false} isChecked={(v) => v === value} onToggle={onChange} />;
}

export function CheckboxCards(
  props: BaseProps & {
    options: ChoiceOption[];
    value: string[];
    onChange: (value: string[]) => void;
    columns?: 1 | 2 | 3;
  },
) {
  const { value, onChange, ...rest } = props;
  return (
    <ChoiceCards
      {...rest}
      multiple
      isChecked={(v) => value.includes(v)}
      onToggle={(v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])}
    />
  );
}

/** Champ piège pour robots, invisible pour les humains et les lecteurs d'écran. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT(wizardMessages);
  return (
    <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        {t("honeypot")}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

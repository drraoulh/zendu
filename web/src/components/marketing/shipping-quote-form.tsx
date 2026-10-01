"use client";

import { type FormEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { contact } from "@/lib/brand";
import { useT } from "@/i18n/define";
import { shippingPage } from "@/i18n/services";
import {
  EMAIL_RE,
  Field,
  FormSuccess,
  buildMailto,
  fieldAria,
  formatLines,
  inputClass,
  openMailto,
} from "./form";

type Mode = "air" | "sea";
type Values = {
  origin: string;
  destination: string;
  mode: Mode;
  weight: string;
  length: string;
  width: string;
  height: string;
  description: string;
  name: string;
  email: string;
  phone: string;
};
type Errors = Partial<Record<keyof Values, string>>;

const INITIAL: Values = {
  origin: "Canada",
  destination: "",
  mode: "air",
  weight: "",
  length: "",
  width: "",
  height: "",
  description: "",
  name: "",
  email: "",
  phone: "",
};

export function ShippingQuoteForm() {
  const t = useT(shippingPage);
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [mailto, setMailto] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = <F extends keyof Values>(field: F, value: Values[F]) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function validate(v: Values): Errors {
    const e: Errors = {};
    if (!v.origin.trim()) e.origin = t("errRequired");
    if (!v.destination.trim()) e.destination = t("errRequired");
    const weight = Number(v.weight.replace(",", "."));
    if (!v.weight.trim()) e.weight = t("errRequired");
    else if (!Number.isFinite(weight) || weight <= 0) e.weight = t("errWeight");
    if (!v.description.trim()) e.description = t("errRequired");
    if (!v.name.trim()) e.name = t("errRequired");
    if (!v.email.trim()) e.email = t("errRequired");
    else if (!EMAIL_RE.test(v.email.trim())) e.email = t("errEmail");
    return e;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`#q-${first}`)?.focus();
      return;
    }

    const type = values.mode === "air" ? t("fAir") : t("fSea");
    const dims = [values.length, values.width, values.height].map((d) => d.trim());
    const dimsText = dims.every((d) => d) ? `${dims.join(" × ")} cm` : "";
    const subject = t("mailSubject", {
      origin: values.origin.trim(),
      destination: values.destination.trim(),
      type,
    });
    const body = [
      t("mailIntro"),
      "",
      formatLines([
        [t("fOrigin"), values.origin],
        [t("fDestination"), values.destination],
        [t("fType"), type],
        [t("fWeight"), values.weight],
        [t("fDims"), dimsText],
      ]),
      "",
      `${t("fDescription")} :`,
      values.description.trim(),
      "",
      formatLines([
        [t("fName"), values.name],
        [t("fEmail"), values.email],
        [t("fPhone"), values.phone],
      ]),
      "",
      t("mailOutro"),
    ].join("\n");

    const href = buildMailto(contact.email, subject, body);
    setMailto(href);
    openMailto(href);
  }

  function reset() {
    setValues(INITIAL);
    setErrors({});
    setMailto(null);
  }

  if (mailto) {
    return (
      <FormSuccess
        title={t("successTitle")}
        text={t("successText")}
        mailtoHref={mailto}
        retryLabel={t("successRetry")}
        resetLabel={t("successReset")}
        onReset={reset}
      />
    );
  }

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="grid gap-5">
      {hasErrors && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {t("errSummary")}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="q-origin" label={t("fOrigin")} error={errors.origin} required>
          <input
            {...fieldAria("q-origin", errors.origin)}
            className={inputClass}
            autoComplete="address-level1"
            value={values.origin}
            onChange={(e) => set("origin", e.target.value)}
          />
        </Field>
        <Field id="q-destination" label={t("fDestination")} error={errors.destination} required>
          <input
            {...fieldAria("q-destination", errors.destination)}
            className={inputClass}
            placeholder={t("fDestinationPh")}
            value={values.destination}
            onChange={(e) => set("destination", e.target.value)}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">{t("fType")}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["air", "sea"] as const).map((mode) => {
            const active = values.mode === mode;
            return (
              <label
                key={mode}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20 ${
                  active ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-white text-ink hover:border-brand/40"
                }`}
              >
                <input
                  type="radio"
                  name="q-mode"
                  value={mode}
                  checked={active}
                  onChange={() => set("mode", mode)}
                  className="sr-only"
                />
                <Icon name={mode === "air" ? "plane" : "ship"} className="h-5 w-5" />
                {mode === "air" ? t("fAir") : t("fSea")}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
        <Field id="q-weight" label={t("fWeight")} error={errors.weight} required>
          <input
            {...fieldAria("q-weight", errors.weight)}
            className={inputClass}
            inputMode="decimal"
            placeholder="10"
            value={values.weight}
            onChange={(e) => set("weight", e.target.value)}
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm font-semibold text-ink">
            {t("fDims")}
            <span className="text-xs font-normal text-muted">{t("optional")}</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {(["length", "width", "height"] as const).map((dim) => {
              const label = dim === "length" ? t("fLength") : dim === "width" ? t("fWidth") : t("fHeight");
              return (
                <input
                  key={dim}
                  id={`q-${dim}`}
                  name={`q-${dim}`}
                  aria-label={`${label} (cm)`}
                  placeholder={label}
                  inputMode="decimal"
                  className={inputClass}
                  value={values[dim]}
                  onChange={(e) => set(dim, e.target.value)}
                />
              );
            })}
          </div>
        </fieldset>
      </div>

      <Field id="q-description" label={t("fDescription")} error={errors.description} required>
        <textarea
          {...fieldAria("q-description", errors.description)}
          rows={4}
          className={`${inputClass} resize-y`}
          placeholder={t("fDescriptionPh")}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="q-name" label={t("fName")} error={errors.name} required className="sm:col-span-2">
          <input
            {...fieldAria("q-name", errors.name)}
            className={inputClass}
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field id="q-email" label={t("fEmail")} error={errors.email} required>
          <input
            {...fieldAria("q-email", errors.email)}
            type="email"
            className={inputClass}
            autoComplete="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field id="q-phone" label={t("fPhone")} optionalLabel={t("optional")}>
          <input
            {...fieldAria("q-phone")}
            type="tel"
            className={inputClass}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">{t("privacyNote")}</p>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Icon name="mail" className="h-4 w-4" />
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localCountryName } from "@/components/app/country-name";
import { Icon } from "@/components/ui/icon";
import { getDestinationCountries } from "@/lib/corridors";
import { useT } from "@/i18n/define";
import { shippingJourney, wizardMessages } from "@/i18n/journeys";
import { RadioCards, SelectInput, TextArea, TextInput } from "./fields";
import { JourneyAside, JourneyShell } from "./shell";
import { EMAIL_RE, PHONE_RE } from "./submit";
import { Wizard, type WizardStep } from "./wizard";

export const PROVINCES = ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"] as const;
type Province = (typeof PROVINCES)[number];

type Values = {
  originProvince: string;
  originCity: string;
  destCountry: string;
  destCity: string;
  deliveryAddress: string;
  mode: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  content: string;
  declaredValue: string;
  pickup: string;
  name: string;
  email: string;
  phone: string;
};

const INITIAL: Values = {
  originProvince: "",
  originCity: "",
  destCountry: "",
  destCity: "",
  deliveryAddress: "",
  mode: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  content: "",
  declaredValue: "",
  pickup: "",
  name: "",
  email: "",
  phone: "",
};

/** Nombre décimal saisi avec virgule ou point ; NaN si invalide. */
function num(v: string): number {
  const s = v.trim().replace(/\s/g, "").replace(",", ".");
  return s && /^\d+(\.\d+)?$/.test(s) ? Number(s) : Number.NaN;
}

export function ShippingQuoteJourney() {
  const t = useT(shippingJourney);
  const w = useT(wizardMessages);
  const { locale } = useI18n();

  const countries = useMemo(
    () =>
      getDestinationCountries()
        .map((c) => localCountryName(c.code, locale, c.name))
        .sort((a, b) => a.localeCompare(b, locale)),
    [locale],
  );

  const provinceName = (code: string) =>
    PROVINCES.includes(code as Province) ? t(`prov_${code as Province}`) : code;
  const modeLabel = (v: string) => (v === "air" ? t("modeAir") : v === "sea" ? t("modeSea") : "");
  const dims = (v: Values) => {
    const parts = [v.length, v.width, v.height].map((d) => d.trim());
    return parts.every(Boolean) ? `${parts.map((p) => p.replace(",", ".")).join(" × ")} cm` : "";
  };

  const steps: WizardStep<Values>[] = [
    {
      key: "route",
      label: t("stepRoute"),
      title: t("routeTitle"),
      description: t("routeText"),
      fields: ["originProvince", "originCity", "destCountry", "destCity", "deliveryAddress", "origin", "destination"],
      validate: (v) => ({
        originProvince: v.originProvince ? undefined : t("errProvince"),
        originCity: v.originCity.trim() ? undefined : w("errRequired"),
        destCountry: v.destCountry.trim() ? undefined : w("errRequired"),
        destCity: v.destCity.trim() ? undefined : w("errRequired"),
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <div className="rounded-2xl border border-line p-4 sm:p-5">
            <p className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Icon name="maple" className="h-4 w-4 text-maple" />
              {t("originHeading")}
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectInput
                id={fieldId("originProvince")}
                label={t("provinceLabel")}
                required
                placeholder={t("provincePlaceholder")}
                error={errors.originProvince}
                value={values.originProvince}
                onChange={(v) => set("originProvince", v)}
                options={PROVINCES.map((p) => ({ value: p, label: t(`prov_${p}`) }))}
              />
              <TextInput
                id={fieldId("originCity")}
                label={t("cityLabel")}
                required
                autoComplete="address-level2"
                maxLength={120}
                placeholder={t("originCityPh")}
                error={errors.originCity}
                value={values.originCity}
                onChange={(v) => set("originCity", v)}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-line p-4 sm:p-5">
            <p className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Icon name="pin" className="h-4 w-4 text-brand" />
              {t("destHeading")}
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput
                id={fieldId("destCountry")}
                label={t("countryLabel")}
                required
                list={`${fieldId("destCountry")}-list`}
                hint={t("countryHint")}
                maxLength={80}
                error={errors.destCountry}
                value={values.destCountry}
                onChange={(v) => set("destCountry", v)}
              />
              <datalist id={`${fieldId("destCountry")}-list`}>
                {countries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <TextInput
                id={fieldId("destCity")}
                label={t("cityLabel")}
                required
                maxLength={120}
                placeholder={t("destCityPh")}
                error={errors.destCity}
                value={values.destCity}
                onChange={(v) => set("destCity", v)}
              />
            </div>
            <TextArea
              className="mt-5"
              id={fieldId("deliveryAddress")}
              label={t("deliveryAddressLabel")}
              hint={t("deliveryAddressHint")}
              rows={2}
              maxLength={300}
              value={values.deliveryAddress}
              onChange={(v) => set("deliveryAddress", v)}
            />
          </div>
        </>
      ),
    },
    {
      key: "mode",
      label: t("stepMode"),
      title: t("modeTitle"),
      description: t("modeText"),
      fields: ["mode"],
      validate: (v) => ({ mode: v.mode === "air" || v.mode === "sea" ? undefined : t("errMode") }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <RadioCards
            id={fieldId("mode")}
            label={t("modeLabel")}
            required
            error={errors.mode}
            value={values.mode}
            onChange={(v) => set("mode", v)}
            options={[
              {
                value: "air",
                label: t("modeAir"),
                description: t("modeAirText"),
                icon: "plane",
                extra: <ModePoints points={[t("air1"), t("air2"), t("air3")]} />,
              },
              {
                value: "sea",
                label: t("modeSea"),
                description: t("modeSeaText"),
                icon: "ship",
                extra: <ModePoints points={[t("sea1"), t("sea2"), t("sea3")]} />,
              },
            ]}
          />
          <p className="flex items-start gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-xs leading-relaxed text-muted">
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            {t("modeNote")}
          </p>
        </>
      ),
    },
    {
      key: "parcel",
      label: t("stepParcel"),
      title: t("parcelTitle"),
      description: t("parcelText"),
      fields: ["weight", "length", "width", "height", "content", "declaredValue", "pickup"],
      validate: (v) => {
        const weight = num(v.weight);
        const anyDim = [v.length, v.width, v.height].some((d) => d.trim());
        const badDim = (d: string) => anyDim && !(num(d) > 0);
        const value = num(v.declaredValue);
        return {
          weight: !v.weight.trim() ? w("errRequired") : !(weight > 0) || weight > 10000 ? t("errWeight") : undefined,
          length: badDim(v.length) ? t("errDims") : undefined,
          width: badDim(v.width) ? t("errDims") : undefined,
          height: badDim(v.height) ? t("errDims") : undefined,
          content: v.content.trim().length >= 3 ? undefined : w("errRequired"),
          declaredValue: v.declaredValue.trim() && !(value >= 0) ? t("errValue") : undefined,
          pickup: v.pickup ? undefined : t("errPickup"),
        };
      },
      render: ({ values, set, errors, fieldId }) => (
        <>
          <TextInput
            id={fieldId("weight")}
            label={t("weightLabel")}
            hint={t("weightHint")}
            required
            inputMode="decimal"
            suffix="kg"
            placeholder="10"
            className="sm:max-w-xs"
            error={errors.weight}
            value={values.weight}
            onChange={(v) => set("weight", v)}
          />
          <fieldset className="min-w-0">
            <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm font-semibold text-ink">
              {t("dimsLabel")}
              <span className="text-xs font-normal text-muted">{w("optional")}</span>
            </legend>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(["length", "width", "height"] as const).map((d) => (
                <TextInput
                  key={d}
                  id={fieldId(d)}
                  label={t(`dim_${d}`)}
                  plain
                  inputMode="decimal"
                  suffix="cm"
                  error={errors[d]}
                  value={values[d]}
                  onChange={(v) => set(d, v)}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-muted">{t("dimsHint")}</p>
          </fieldset>
          <TextArea
            id={fieldId("content")}
            label={t("contentLabel")}
            hint={t("contentHint")}
            required
            rows={3}
            maxLength={1500}
            placeholder={t("contentPh")}
            error={errors.content}
            value={values.content}
            onChange={(v) => set("content", v)}
          />
          <TextInput
            id={fieldId("declaredValue")}
            label={t("valueLabel")}
            hint={t("valueHint")}
            inputMode="decimal"
            suffix="CAD"
            className="sm:max-w-xs"
            error={errors.declaredValue}
            value={values.declaredValue}
            onChange={(v) => set("declaredValue", v)}
          />
          <RadioCards
            id={fieldId("pickup")}
            label={t("pickupLabel")}
            required
            error={errors.pickup}
            value={values.pickup}
            onChange={(v) => set("pickup", v)}
            options={[
              { value: "yes", label: t("pickupYes"), description: t("pickupYesText"), icon: "pin" },
              { value: "no", label: t("pickupNo"), description: t("pickupNoText"), icon: "box" },
            ]}
          />
        </>
      ),
    },
    {
      key: "contact",
      label: t("stepContact"),
      title: t("contactTitle"),
      description: t("contactText"),
      fields: ["name", "email", "phone"],
      validate: (v) => ({
        name: v.name.trim().length >= 2 ? undefined : w("errName"),
        email: !v.email.trim() ? w("errRequired") : EMAIL_RE.test(v.email.trim()) ? undefined : w("errEmail"),
        phone: v.phone.trim() && !PHONE_RE.test(v.phone.trim()) ? w("errPhone") : undefined,
      }),
      render: ({ values, set, errors, fieldId }) => (
        <>
          <TextInput
            id={fieldId("name")}
            label={w("fName")}
            required
            autoComplete="name"
            maxLength={120}
            error={errors.name}
            value={values.name}
            onChange={(v) => set("name", v)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput
              id={fieldId("email")}
              label={w("fEmail")}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              error={errors.email}
              value={values.email}
              onChange={(v) => set("email", v)}
            />
            <TextInput
              id={fieldId("phone")}
              label={w("fPhone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              hint={t("phoneHint")}
              error={errors.phone}
              value={values.phone}
              onChange={(v) => set("phone", v)}
            />
          </div>
        </>
      ),
    },
  ];

  return (
    <JourneyShell
      back={{ href: "/shipping", label: t("back") }}
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      icon="box"
      aside={<JourneyAside title={t("asideTitle")} points={[t("aside1"), t("aside2"), t("aside3")]} />}
    >
      <Wizard<Values>
        id="ship"
        kind="shipping_quote"
        initial={INITIAL}
        steps={steps}
        issueField={(path) => {
          const last = path[path.length - 1];
          const map: Record<string, string> = {
            origin: "originCity",
            destination: "destCity",
            weightKg: "weight",
            dimensionsCm: "length",
            declaredValue: "declaredValue",
            pickup: "pickup",
            content: "content",
            mode: "mode",
            deliveryAddress: "deliveryAddress",
          };
          if (path.includes("dimensionsCm")) return "length";
          return map[last] ?? last;
        }}
        summary={(v) => [
          {
            title: t("stepRoute"),
            step: 0,
            rows: [
              { label: t("sumFrom"), value: [v.originCity.trim(), provinceName(v.originProvince), "Canada"].filter(Boolean).join(", ") },
              { label: t("sumTo"), value: [v.destCity.trim(), v.destCountry.trim()].filter(Boolean).join(", ") },
              { label: t("deliveryAddressLabel"), value: v.deliveryAddress },
            ],
          },
          { title: t("stepMode"), step: 1, rows: [{ label: t("modeLabel"), value: modeLabel(v.mode) }] },
          {
            title: t("stepParcel"),
            step: 2,
            rows: [
              { label: t("weightLabel"), value: v.weight.trim() ? `${v.weight.trim().replace(",", ".")} kg` : "" },
              { label: t("dimsLabel"), value: dims(v) },
              { label: t("contentLabel"), value: v.content },
              { label: t("valueLabel"), value: v.declaredValue.trim() ? `${v.declaredValue.trim()} CAD` : "" },
              { label: t("pickupLabel"), value: v.pickup === "yes" ? t("pickupYes") : v.pickup === "no" ? t("pickupNo") : "" },
            ],
          },
          {
            title: t("stepContact"),
            step: 3,
            rows: [
              { label: w("fName"), value: v.name },
              { label: w("fEmail"), value: v.email },
              { label: w("fPhone"), value: v.phone },
            ],
          },
        ]}
        toRequest={(v) => {
          const hasDims = [v.length, v.width, v.height].every((d) => num(d) > 0);
          const declared = num(v.declaredValue);
          return {
            name: v.name,
            email: v.email,
            phone: v.phone,
            payload: {
              origin: [v.originCity.trim(), v.originProvince, "Canada"].filter(Boolean).join(", "),
              destination: [v.destCity.trim(), v.destCountry.trim()].filter(Boolean).join(", "),
              mode: v.mode,
              weightKg: num(v.weight),
              dimensionsCm: hasDims
                ? { length: num(v.length), width: num(v.width), height: num(v.height) }
                : undefined,
              content: v.content.trim(),
              declaredValue: Number.isFinite(declared) ? declared : undefined,
              pickup: v.pickup === "yes",
              deliveryAddress: v.deliveryAddress.trim() || undefined,
            },
          };
        }}
      />
    </JourneyShell>
  );
}

function ModePoints({ points }: { points: string[] }) {
  return (
    <ul className="mt-3 grid gap-1.5">
      {points.map((p) => (
        <li key={p} className="flex items-start gap-2 text-xs text-muted">
          <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.6} />
          {p}
        </li>
      ))}
    </ul>
  );
}

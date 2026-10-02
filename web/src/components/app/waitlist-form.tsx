"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { localCountryName } from "@/components/app/country-name";
import { appMessages } from "@/i18n/app";
import { useT } from "@/i18n/define";

type Status = "idle" | "sending" | "done" | "invalid" | "unavailable" | "error";

/** Formulaire de liste d'attente de l'application (POST /api/waitlist). */
export function WaitlistForm({
  destinations,
  defaultCountry,
  source = "application",
}: {
  destinations: { code: string; name: string }[];
  defaultCountry?: string;
  source?: string;
}) {
  const t = useT(appMessages);
  const { locale } = useI18n();
  const id = useId();
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const sorted = [...destinations]
    .map((d) => ({ ...d, label: localCountryName(d.code, locale, d.name) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, country: country || undefined, locale, source, consent, website }),
      });
      if (res.ok) setStatus("done");
      else if (res.status === 400) setStatus("invalid");
      else if (res.status === 503) setStatus("unavailable");
      else setStatus("error");
    } catch {
      setStatus("unavailable");
    }
  }

  if (status === "done") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl bg-success/10 p-4 text-sm font-semibold text-success">
        <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0" />
        {t("joined")}
      </div>
    );
  }

  const error =
    status === "invalid"
      ? t("errorInvalid")
      : status === "unavailable"
        ? t("errorUnavailable")
        : status === "error"
          ? t("errorGeneric")
          : null;

  const field =
    "mt-1.5 w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={`${id}-email`} className="text-sm font-semibold text-ink">
          {t("emailLabel")}
        </label>
        <input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className={field}
        />
      </div>

      <div>
        <label htmlFor={`${id}-country`} className="text-sm font-semibold text-ink">
          {t("countryLabel")}
        </label>
        <select id={`${id}-country`} value={country} onChange={(e) => setCountry(e.target.value)} className={field}>
          <option value="">{t("countryNone")}</option>
          {sorted.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Champ piège anti-robots : invisible et ignoré par les lecteurs d'écran. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          id={`${id}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-brand"
          required
        />
        <span>{t("consentLabel")}</span>
      </label>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? t("joining") : t("join")}
        {status !== "sending" && <Icon name="arrowRight" className="h-4 w-4" />}
      </Button>

      <p className="text-xs text-muted">
        {t("privacyNote")}{" "}
        <Link href="/confidentialite" className="font-semibold text-brand hover:underline">
          {t("privacyLink")}
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { trackingMessages } from "@/i18n/journeys";
import { inputClass } from "./fields";
import { normalizeTrackingNumber } from "./tracking";

/** Cartes d'offres détaillées : icône, titre, texte et points inclus. */
export function DetailedOffers({
  id,
  eyebrow,
  title,
  subtitle,
  items,
  footer,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: { icon: IconName; title: string; text: string; points: string[] }[];
  footer?: ReactNode;
}) {
  return (
    <Section id={id} className="scroll-mt-20">
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="group flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon name={item.icon} className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
              <ul className="mt-5 grid gap-2 border-t border-line pt-5">
                {item.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-ink">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.6} />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {footer && <div className="mt-8">{footer}</div>}
      </Container>
    </Section>
  );
}

/** Liste de points cochés en grille (ce qui est inclus, ce qu'on peut envoyer…). */
export function CheckGrid({ items, tone = "brand" }: { items: string[]; tone?: "brand" | "success" }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink shadow-card">
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
              tone === "success" ? "bg-success/15 text-success" : "bg-brand text-white"
            }`}
          >
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Petit formulaire « suivre un colis » qui renvoie vers /shipping/suivi?numero=… */
export function TrackBox({ title, text, label, placeholder }: { title: string; text: string; label: string; placeholder: string }) {
  const t = useT(trackingMessages);
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = normalizeTrackingNumber(value);
    if (!n) {
      setError(true);
      document.getElementById("trackbox-number")?.focus();
      return;
    }
    router.push(`/shipping/suivi?numero=${encodeURIComponent(n)}`);
  }

  return (
    <div className="bg-navy-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-float sm:p-8">
      <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="relative">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-sky">
          <Icon name="pin" className="h-6 w-6" />
        </span>
        <h3 className="mt-5 font-display text-xl font-extrabold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/75">{text}</p>
        <form noValidate onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row" role="search">
          <label htmlFor="trackbox-number" className="sr-only">
            {label}
          </label>
          <input
            id="trackbox-number"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(false);
            }}
            aria-invalid={error || undefined}
            aria-describedby={error ? "trackbox-error" : undefined}
            className={`${inputClass} font-mono uppercase tracking-wider sm:flex-1`}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:bg-brand-soft"
          >
            {t("search")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </form>
        {error && (
          <p id="trackbox-error" role="alert" className="mt-2 text-xs font-medium text-sky">
            {t("errFormat")}
          </p>
        )}
      </div>
    </div>
  );
}

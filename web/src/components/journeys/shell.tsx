"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { wizardMessages } from "@/i18n/journeys";
import { ContactLink } from "./contact-link";

/** Mise en page commune des parcours : en-tête compact, contenu principal, colonne d'aide. */
export function JourneyShell({
  back,
  eyebrow,
  title,
  subtitle,
  icon,
  children,
  aside,
}: {
  back: { href: string; label: string };
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: IconName;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <>
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative pb-24 pt-10 sm:pb-28 sm:pt-14">
          <Link
            href={back.href}
            className="inline-flex items-center gap-1.5 rounded-full text-sm font-semibold text-white/75 transition hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
          >
            <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
            {back.label}
          </Link>
          <div className="mt-6 flex items-start gap-4">
            <span className="bg-brand-gradient hidden h-14 w-14 shrink-0 place-items-center rounded-2xl shadow-float ring-1 ring-white/30 sm:grid">
              <Icon name={icon} className="h-7 w-7 text-white" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-sky">{eyebrow}</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{subtitle}</p>}
            </div>
          </div>
        </Container>
      </section>
      <Container className="relative -mt-16 pb-16 sm:-mt-20 sm:pb-24">
        <div className={aside ? "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8" : ""}>
          <div className="min-w-0">{children}</div>
          {aside && <aside className="grid gap-4 lg:sticky lg:top-24">{aside}</aside>}
        </div>
      </Container>
    </>
  );
}

/** Carte « Ce qui se passe ensuite » + contact, réutilisée par les parcours. */
export function JourneyAside({ title, points }: { title: string; points: string[] }) {
  const t = useT(wizardMessages);
  return (
    <>
      <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
        <ol className="mt-4 grid gap-3">
          {points.map((p, i) => (
            <li key={p} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-black text-brand">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </div>
      <div className="rounded-3xl bg-surface-soft p-5 sm:p-6">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-ink">
          <Icon name="mail" className="h-4 w-4 text-brand" />
          {t("asideHelpTitle")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("asideHelpText")}</p>
        <p className="mt-3 text-sm">
          <ContactLink />
        </p>
      </div>
    </>
  );
}

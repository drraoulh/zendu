"use client";

import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { countryName } from "@/components/transfer/transfer-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

export type HomeDestination = { code: string; name: string; currency: string };

export function DestinationsSection({ destinations }: { destinations: HomeDestination[] }) {
  const t = useT(homeMessages);
  const { locale } = useI18n();
  const items = destinations
    .map((d) => ({ ...d, label: countryName(d.code, locale, d.name) }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));

  return (
    <Section className="bg-white">
      <Container>
        <SectionHeading
          eyebrow={t("destEyebrow")}
          title={t("destTitle")}
          subtitle={t("destSubtitle", { n: destinations.length })}
        />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((d) => (
            <li key={d.code}>
              <Link
                href={`/send?corridor=CA-${d.code}`}
                aria-label={t("destSendTo", { country: d.label })}
                className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card"
              >
                <CountryFlag code={d.code} size={32} title={d.label} className="shrink-0 rounded" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
                    {d.label}
                  </span>
                  <span className="block text-xs text-muted">{d.currency}</span>
                </span>
                <Icon
                  name="arrowRight"
                  className="hidden h-4 w-4 shrink-0 text-brand opacity-0 transition group-hover:opacity-100 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function BrandSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-bg">
      <Container>
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line bg-white p-6 shadow-card sm:p-10 lg:grid-cols-[minmax(0,0.85fr)_1.15fr] lg:gap-14">
          <div className="relative mx-auto w-full max-w-sm">
            <div aria-hidden className="absolute -inset-6 rounded-full bg-gradient-to-br from-brand-soft via-white to-sky/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-float">
              <LogoFull className="h-auto w-full" />
            </div>
          </div>
          <div>
            <Eyebrow>{t("brandEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {t("brandTitle")}
            </h2>
            <blockquote className="mt-5 border-l-4 border-brand pl-4">
              <p className="text-gradient-brand font-display text-xl font-extrabold leading-snug sm:text-2xl">
                {t("brandTagline")}
              </p>
            </blockquote>
            <p className="mt-6 leading-relaxed text-muted">{t("brandStory1")}</p>
            <p className="mt-4 leading-relaxed text-muted">{t("brandStory2")}</p>
            <ButtonLink href="/a-propos" variant="secondary" className="mt-7">
              {t("brandCta")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export function FaqSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-white">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <SectionHeading eyebrow={t("faqEyebrow")} title={t("faqTitle")} subtitle={t("faqSubtitle")} />
          <ButtonLink href="/contact" variant="secondary" className="mt-7">
            <Icon name="mail" className="h-4 w-4" />
            {t("faqContact")}
          </ButtonLink>
        </div>
        <div className="space-y-3">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <details
              key={n}
              className="group rounded-2xl border border-line bg-white px-5 py-4 transition open:border-brand/25 open:bg-surface-soft/50 open:shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-bold text-ink [&::-webkit-details-marker]:hidden">
                {t(`q${n}` as HomeKey)}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition group-open:rotate-180">
                  <Icon name="chevronDown" className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t(`a${n}` as HomeKey)}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export function FinalCta() {
  const t = useT(homeMessages);
  return (
    <section className="px-5 pb-16 sm:px-6 sm:pb-20">
      <div className="bg-brand-gradient relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-12 text-white shadow-float sm:px-12 sm:py-16">
        <div aria-hidden className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <svg
          aria-hidden
          viewBox="0 0 300 300"
          fill="none"
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-50"
        >
          <circle cx="150" cy="150" r="140" stroke="rgba(255,255,255,0.35)" />
          <circle cx="150" cy="150" r="95" stroke="rgba(255,255,255,0.2)" strokeDasharray="2 8" />
        </svg>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-black tracking-tight sm:text-4xl">{t("ctaTitle")}</h2>
            <p className="mt-3 text-lg text-white/80">{t("ctaSubtitle")}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <ButtonLink href="/send" variant="white" size="lg">
              {t("ctaSend")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline-light" size="lg">
              {t("ctaContact")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

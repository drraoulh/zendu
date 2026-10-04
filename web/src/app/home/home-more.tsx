"use client";

import type { MouseEvent } from "react";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { StoreBadges } from "@/components/app/store-badges";
import { WstLogo } from "@/components/brand/wst-logo";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { HomeScreen, PhoneFrame } from "@/components/marketing/wst/phone-screens";
import { countryName, selectCalculatorCorridor } from "@/components/transfer/transfer-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

export type HomeRoute = {
  id: string;
  source: string;
  sourceName: string;
  dest: string;
  destName: string;
  sendCurrency: string;
  receiveCurrency: string;
  networks: Array<{ label: string; type: string }>;
  fast: boolean;
};

function corridorHref(id: string) {
  return `/?corridor=${encodeURIComponent(id)}#simulateur`;
}

/** Les trajets ouverts : un clic présélectionne le simulateur de l'accueil. */
export function DestinationsSection({ routes }: { routes: HomeRoute[] }) {
  const t = useT(homeMessages);
  const { locale } = useI18n();

  const onPick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const target = document.getElementById("simulateur");
    if (!target) return;
    e.preventDefault();
    selectCalculatorCorridor(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Section className="bg-bg">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t("destEyebrow")} title={t("destTitle")} subtitle={t("destSubtitle", { n: routes.length })} />
          <ButtonLink href="/pays" variant="secondary" className="self-start lg:self-auto">
            <Icon name="globe" className="h-4 w-4" />
            {t("destAll")}
          </ButtonLink>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => {
            const from = countryName(r.source, locale, r.sourceName);
            const to = countryName(r.dest, locale, r.destName);
            return (
              <li key={r.id}>
                <a
                  href={corridorHref(r.id)}
                  onClick={(e) => onPick(e, r.id)}
                  aria-label={t("destSendTo", { country: `${from} → ${to}` })}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                >
                  <span className="flex items-center gap-2">
                    <CountryFlag code={r.source} size={28} title="" className="shrink-0 rounded" />
                    <Icon name="arrowRight" className="h-4 w-4 text-brand" />
                    <CountryFlag code={r.dest} size={28} title="" className="shrink-0 rounded" />
                    <span className="ml-1 min-w-0 flex-1 text-sm font-bold leading-snug text-ink">
                      {from} → {to}
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-1.5">
                    {r.networks.map((n) => (
                      <span key={n.label} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-strong">
                        {n.type === "bank" ? t("netBank") : n.type === "cash" ? t("netCash") : n.label}
                      </span>
                    ))}
                  </span>
                  <span className="mt-auto flex items-center justify-between text-xs text-muted">
                    <span>
                      {r.sendCurrency} → {r.receiveCurrency} · {r.fast ? t("routeFast") : t("routeDay")}
                    </span>
                    <span className="font-semibold text-brand opacity-0 transition group-hover:opacity-100">{t("routeSimulate")}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

export function AppSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-white">
      <Container>
        <div className="bg-navy-gradient relative grid items-center gap-12 overflow-hidden rounded-[2rem] px-6 pt-12 text-white shadow-float sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-14 lg:pt-14">
          <div aria-hidden className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_right,black,transparent)]" />
          <div aria-hidden className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
          <div className="relative pb-0 lg:pb-14">
            <WstLogo variant="negative" className="h-8 w-auto sm:h-9" />
            <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("appTitle")}</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{t("appText")}</p>
            <ul className="mt-6 space-y-2.5">
              {(["appPoint1", "appPoint2", "appPoint3"] as const).map((key) => (
                <li key={key} className="flex gap-2.5 text-sm text-white/90 sm:text-base">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sky" strokeWidth={2.4} />
                  {t(key)}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <StoreBadges dark />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink href="/application" variant="white">
                {t("appLink")}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/transfert" variant="outline-light">
                {t("appProduct")}
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto -mb-28 w-full max-w-[300px] sm:-mb-24 lg:mb-[-7rem]">
            <div aria-hidden className="absolute -inset-8 rounded-full bg-sky/25 blur-3xl" />
            <PhoneFrame>
              <HomeScreen />
            </PhoneFrame>
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
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/aide" variant="secondary">
              <Icon name="info" className="h-4 w-4" />
              {t("faqHelp")}
            </ButtonLink>
            <ButtonLink href="/contact" variant="ghost">
              <Icon name="mail" className="h-4 w-4" />
              {t("faqContact")}
            </ButtonLink>
          </div>
        </div>
        <div className="space-y-3">
          {([1, 2, 3, 4] as const).map((n) => (
            <details
              key={n}
              className="group rounded-2xl border border-line bg-white px-5 py-4 transition open:border-brand/25 open:bg-surface-soft/50 open:shadow-card"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-display font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [&::-webkit-details-marker]:hidden">
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
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href="/contact" variant="white" size="lg">
              <Icon name="mail" className="h-4 w-4" />
              {t("ctaContact")}
            </ButtonLink>
            <AppDownloadButton variant="outline-light" size="lg" label={t("ctaSend")} />
          </div>
        </div>
      </div>
    </section>
  );
}

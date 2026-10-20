"use client";

import { AppDownloadButton } from "@/components/app/app-download-button";
import { StoreBadges } from "@/components/app/store-badges";
import { WstLogo } from "@/components/brand/wst-logo";
import { useSite } from "@/components/site-provider";
import { HomeScreen, PhoneFrame } from "@/components/marketing/wst/phone-screens";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

export function AppSection() {
  const t = useT(homeMessages);
  const { link } = useSite();
  return (
    <Section className="bg-white">
      <Container>
        <div className="bg-navy-gradient relative grid items-center gap-12 overflow-hidden rounded-3xl px-6 pt-12 text-white sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-14 lg:pt-14">
          <div aria-hidden className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative pb-0 lg:pb-14">
            <WstLogo variant="negative" className="h-8 w-auto sm:h-9" />
            <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] sm:text-5xl">{t("appTitle")}</h2>
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
              <ButtonLink href={link("/application")} variant="white">
                {t("appLink")}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={link("/transfert")} variant="outline-light">
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
        <div className="border-t border-line">
          {([1, 2, 3, 4] as const).map((n) => (
            <details key={n} className="group border-b border-line py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded font-display text-lg font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 [&::-webkit-details-marker]:hidden">
                {t(`q${n}` as HomeKey)}
                <Icon name="chevronDown" className="h-5 w-5 shrink-0 text-ink transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{t(`a${n}` as HomeKey)}</p>
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
    <section className="pb-16 sm:pb-24">
      <Container>
      <div className="bg-brand-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">{t("ctaTitle")}</h2>
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
      </Container>
    </section>
  );
}

"use client";

import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/button";
import { WstLogo } from "@/components/brand/wst-logo";
import { CompanyValue } from "@/components/info/shared";
import { company, companyLocality, telHref } from "@/lib/company";
import { aboutPage } from "@/i18n/company";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";
import { CtaBand, FeatureGrid, range } from "./sections";

type K = keyof typeof aboutPage.fr;

const VALUE_ICONS: IconName[] = ["shield", "sparkle", "users", "star", "tech", "check"];
const POLES: Array<{ href: string; icon: IconName }> = [
  { href: "/transfert", icon: "transfer" },
  { href: "/finances", icon: "finance" },
  { href: "/technologies", icon: "code" },
  { href: "/shipping", icon: "ship" },
];

export function AboutContent() {
  const t = useT(aboutPage);
  const c = useT(common);
  const k = (key: string) => t(key as K);
  const locality = companyLocality();
  const facts: Array<{ label: string; value: string | null; href?: string | null }> = [
    { label: t("factLegalName"), value: company.legalName },
    { label: t("factBrand"), value: company.brandName },
    { label: t("factAddress"), value: company.address },
    { label: t("factLocality"), value: locality },
    { label: t("factCountry"), value: company.country },
    { label: t("factEmail"), value: company.email, href: company.email ? `mailto:${company.email}` : null },
    { label: t("factPhone"), value: company.phone, href: company.phone ? telHref(company.phone) : null },
    { label: t("factHours"), value: company.hours },
  ];

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="#poles" variant="white" size="lg">
            {t("heroCta")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/contact" variant="outline-light" size="lg">
            {t("heroCta2")}
          </ButtonLink>
        </div>
      </PageHero>

      {/* Histoire + logo officiel */}
      <Section>
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <figure className="mx-auto w-full max-w-md">
              {/* Badge ancré sur l'image (et non sur la légende, qu'il recouvrait). */}
              <div className="relative">
                <div aria-hidden className="bg-brand-gradient absolute -inset-3 rotate-2 rounded-[2.25rem] opacity-15 blur-sm" />
                <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-4 shadow-float sm:p-6">
                  <LogoFull className="h-auto w-full rounded-2xl" priority />
                </div>
                <span className="absolute -bottom-4 left-1/2 inline-flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card">
                  <Icon name="maple" className="h-4 w-4 shrink-0 text-maple" />
                  <span className="truncate">
                    {t("basedIn")}
                    {company.city ? ` · ${company.city}` : ""}
                  </span>
                </span>
              </div>
              <figcaption className="mt-10 text-center text-xs leading-relaxed text-muted">{t("logoCaption")}</figcaption>
            </figure>

            <div>
              <SectionHeading eyebrow={t("storyEyebrow")} title={t("storyTitle")} />
              <div className="mt-6 grid gap-4 text-base leading-relaxed text-muted">
                <p>{t("story1")}</p>
                <p>{t("story2")}</p>
                <p>{t("story3")}</p>
              </div>
              <p className="mt-8 border-l-4 border-brand pl-4 font-display text-lg font-bold italic text-ink">
                « {c("tagline")} »
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Mission & vision */}
      <Section className="bg-surface-soft">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            <article className="bg-navy-gradient relative overflow-hidden rounded-3xl p-8 text-white shadow-float sm:p-10">
              <div aria-hidden className="bg-grid absolute inset-0 opacity-40" />
              <div className="relative">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-sky">
                  <Icon name="globe" className="h-6 w-6" />
                </span>
                <h2 className="mt-6 font-display text-2xl font-extrabold sm:text-3xl">{t("missionTitle")}</h2>
                <p className="mt-4 leading-relaxed text-white/75">{t("missionText")}</p>
              </div>
            </article>
            <article className="rounded-3xl border border-line bg-white p-8 shadow-card sm:p-10">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="star" className="h-6 w-6" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-extrabold text-ink sm:text-3xl">{t("visionTitle")}</h2>
              <p className="mt-4 leading-relaxed text-muted">{t("visionText")}</p>
            </article>
          </div>
        </Container>
      </Section>

      <FeatureGrid
        eyebrow={t("valuesEyebrow")}
        title={t("valuesTitle")}
        subtitle={t("valuesSubtitle")}
        items={range(6).map((i) => ({
          icon: VALUE_ICONS[i - 1],
          title: k(`value${i}Title`),
          text: k(`value${i}Text`),
        }))}
      />

      {/* 4 pôles */}
      <Section id="poles" className="bg-navy-gradient scroll-mt-20 text-white">
        <Container>
          <SectionHeading light eyebrow={t("polesEyebrow")} title={t("polesTitle")} subtitle={t("polesSubtitle")} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {POLES.map((pole, idx) => {
              const i = idx + 1;
              return (
                <li key={pole.href}>
                  <Link
                    href={pole.href}
                    className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-sky/50 hover:bg-white/10"
                  >
                    <span className="bg-brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white ring-1 ring-white/20">
                      <Icon name={pole.icon} className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold">{k(`pole${i}Title`)}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{k(`pole${i}Text`)}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky transition group-hover:text-white">
                      {t("discover")}
                      <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* WorldSoft Transfer, une solution PWFINTECH */}
      <Section>
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <SectionHeading eyebrow={t("wstEyebrow")} title={t("wstTitle")} />
              <div className="mt-6 grid gap-4 text-base leading-relaxed text-muted">
                <p>{t("wstText1")}</p>
                <p>{t("wstText2")}</p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/application" size="lg">
                  {t("wstCtaApp")}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/frais" variant="secondary" size="lg">
                  {t("wstCtaFees")}
                </ButtonLink>
                <ButtonLink href="/pays" variant="ghost" size="lg">
                  {t("wstCtaCountries")}
                </ButtonLink>
              </div>
            </div>
            <div className="rounded-[2rem] border border-line bg-white p-6 shadow-float sm:p-8">
              <WstLogo variant="horizontal" className="h-9 w-auto" />
              <ul className="mt-6 grid gap-3">
                {(["wstPoint1", "wstPoint2", "wstPoint3"] as const).map((key) => (
                  <li key={key} className="flex gap-3 text-sm leading-relaxed text-ink">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* Conformité + fiche entreprise */}
      <Section className="bg-surface-soft">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="shield" className="h-6 w-6" />
              </span>
              <p className="mt-6 font-display text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("complianceEyebrow")}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">{t("complianceTitle")}</h2>
              <div className="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
                <p>{t("complianceText1")}</p>
                <p>{t("complianceText2")}</p>
              </div>
              <dl className="mt-6 grid gap-3 rounded-2xl bg-surface-soft p-4 text-sm">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="font-semibold text-ink">{t("complianceReg")}</dt>
                  <dd className="sm:text-right">
                    <CompanyValue value={company.registration} className="font-semibold text-ink" />
                  </dd>
                </div>
                {!company.registration && (
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
                    <dt className="font-semibold text-ink">{t("complianceStatus")}</dt>
                    <dd className="text-muted sm:text-right">{t("complianceStatusValue")}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 text-xs text-muted">{t("complianceVerify")}</p>
            </article>

            <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="info" className="h-6 w-6" />
              </span>
              <p className="mt-6 font-display text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("factsEyebrow")}</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">{t("factsTitle")}</h2>
              <dl className="mt-5 divide-y divide-line text-sm">
                {facts.map((f) => (
                  <div key={f.label} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4">
                    <dt className="text-muted">{f.label}</dt>
                    <dd className="min-w-0 break-words sm:text-right">
                      <CompanyValue value={f.value} href={f.href} className={f.href ? "font-semibold text-brand hover:text-brand-strong" : "font-semibold text-ink"} />
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>
        </Container>
      </Section>

      <div className="pt-12 sm:pt-14">
        <CtaBand
          title={t("ctaTitle")}
          text={t("ctaText")}
          primary={{ href: "/contact", label: t("heroCta2") }}
          secondary={{ href: "/transfert", label: c("sendMoney") }}
        />
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";
import { ButtonLink } from "@/components/ui/button";
import { contact } from "@/lib/brand";
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
            <figure className="relative mx-auto w-full max-w-md">
              <div aria-hidden className="bg-brand-gradient absolute -inset-3 rotate-2 rounded-[2.25rem] opacity-15 blur-sm" />
              <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-4 shadow-float sm:p-6">
                <LogoFull className="h-auto w-full rounded-2xl" priority />
              </div>
              <span className="absolute -bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink shadow-card">
                <Icon name="maple" className="h-4 w-4 text-maple" />
                {t("basedIn")} · {contact.city}
              </span>
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

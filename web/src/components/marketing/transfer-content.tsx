"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { StoreBadges } from "@/components/app/store-badges";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import {
  TransferCalculator,
  countryName,
  selectCalculatorCorridor,
  simulatorHref,
} from "@/components/transfer/transfer-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { PaymentLogo } from "@/components/ui/payment-logo";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { marketing, transferPage } from "@/i18n/services";
import { CORRIDORS, getCountry, getDestinationCountries, type PayoutNetwork } from "@/lib/corridors";
import { Faq, FeatureGrid, Steps, range } from "./sections";
import { HomeScreen, InteracScreen, PhoneShot, ReviewScreen, TrackingScreen } from "./wst/phone-screens";

type K = keyof typeof transferPage.fr;

const SEC_ICONS: IconName[] = ["user", "lock", "receipt", "users"];

export function TransferContent() {
  const t = useT(transferPage);
  const m = useT(marketing);
  const { locale } = useI18n();
  const k = (key: string) => t(key as K);

  /* Destinations et réseaux de réception, depuis src/lib/corridors.ts */
  const { destinations, byType } = useMemo(() => {
    const countries = getDestinationCountries();
    const list = CORRIDORS.filter((c) => c.active).map((c) => {
      const from = getCountry(c.source);
      const to = getCountry(c.destination);
      return {
        corridorId: c.id,
        source: from.code,
        code: to.code,
        name: `${countryName(from.code, locale, from.name)} → ${countryName(to.code, locale, to.name)}`,
        currency: `${from.currency} → ${to.currency}`,
        modes: to.networks.length,
      };
    });

    const types: Record<PayoutNetwork["type"], { labels: string[]; ids: string[]; countries: number }> = {
      mobile_money: { labels: [], ids: [], countries: 0 },
      bank: { labels: [], ids: [], countries: 0 },
      cash: { labels: [], ids: [], countries: 0 },
    };
    for (const c of countries) {
      const seen = new Set<string>();
      for (const n of c.networks) {
        if (n.type === "mobile_money" && !types.mobile_money.labels.includes(n.label)) {
          types.mobile_money.labels.push(n.label);
          types.mobile_money.ids.push(n.id);
        }
        seen.add(n.type);
      }
      for (const type of seen) types[type as PayoutNetwork["type"]].countries += 1;
    }
    return { destinations: list, byType: types };
  }, [locale]);

  return (
    <>
      <Hero />

      {/* L'application */}
      <Section id="application" className="scroll-mt-20 overflow-hidden bg-white">
        <Container className="xl:max-w-7xl">
          <SectionHeading align="center" eyebrow={t("appEyebrow")} title={t("appTitle")} subtitle={t("appSubtitle")} />
          <StoreBadges className="mt-8 justify-center" />
          <div className="relative mt-14">
            <div className="relative grid gap-14 sm:grid-cols-2 sm:gap-x-6 xl:grid-cols-4 xl:gap-x-5">
              <PhoneShot title={t("shot1Title")} text={t("shot1Text")}>
                <HomeScreen />
              </PhoneShot>
              <PhoneShot title={t("shot2Title")} text={t("shot2Text")} className="xl:translate-y-10">
                <ReviewScreen />
              </PhoneShot>
              <PhoneShot title={t("shot3Title")} text={t("shot3Text")}>
                <InteracScreen />
              </PhoneShot>
              <PhoneShot title={t("shot4Title")} text={t("shot4Text")} className="xl:translate-y-10">
                <TrackingScreen />
              </PhoneShot>
            </div>
          </div>
          <p className="mt-14 text-center text-xs text-muted md:mt-20">{t("mockNote")}</p>
        </Container>
      </Section>

      <Steps
        eyebrow={t("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      {/* Frais et délais */}
      <Section id="frais" className="scroll-mt-20 bg-white">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <SectionHeading eyebrow={t("feesEyebrow")} title={t("feesTitle")} subtitle={t("feesSubtitle")} />
            <ul className="mt-10 space-y-4">
              {(
                [
                  ["receipt", "fee1"],
                  ["chart", "fee2"],
                  ["clock", "fee3"],
                ] as const
              ).map(([icon, key]) => (
                <li key={key} className="flex gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <Icon name={icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-display font-semibold text-ink">{k(`${key}Title`)}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{k(`${key}Text`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="self-center">
            <div className="bg-navy-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-float sm:p-8">
              <div className="relative">
                <p className="font-display text-sm font-semibold text-sky">{t("etaTitle")}</p>
                <dl className="mt-5 divide-y divide-white/10">
                  {(
                    [
                      ["phone", "etaMobile", "etaMobileValue"],
                      ["card", "etaBank", "etaBankValue"],
                    ] as const
                  ).map(([icon, label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                      <dt className="flex items-center gap-2.5 text-sm text-white/80">
                        <Icon name={icon} className="h-4 w-4 text-sky" />
                        {t(label)}
                      </dt>
                      <dd className="text-right font-display text-sm font-semibold">{t(value)}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-4 text-xs leading-relaxed text-white/60">{t("etaNote")}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <ButtonLink href="#simulateur" variant="white" className="w-full sm:w-auto">
                    {t("feesCta")}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink href="/frais" variant="outline-light" className="w-full sm:w-auto">
                    <Icon name="receipt" className="h-4 w-4" />
                    {t("feesAll")}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Modes de réception + destinations */}
      <Section id="destinations" className="scroll-mt-20 bg-surface-soft">
        <Container>
          <SectionHeading eyebrow={t("payEyebrow")} title={t("payTitle")} subtitle={t("paySubtitle")} />
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            <PayoutCard
              icon="phone"
              title={t("payMobileTitle")}
              text={t("payMobileText")}
              count={t("payCountries", { n: byType.mobile_money.countries })}
              chips={byType.mobile_money.labels.map((label, i) => ({ label, id: byType.mobile_money.ids[i] }))}
            />
            <PayoutCard
              icon="card"
              title={t("payBankTitle")}
              text={t("payBankText")}
              count={t("payCountries", { n: byType.bank.countries })}
            />
          </ul>

          <div className="mt-16">
            <SectionHeading
              eyebrow={t("destEyebrow")}
              title={t("destTitle")}
              subtitle={t("destSubtitle", { n: destinations.length })}
            />
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((d) => {
                const corridorId = d.corridorId;
                return (
                  <li key={corridorId}>
                    <Link
                      href={simulatorHref(corridorId)}
                      scroll={false}
                      onClick={() => {
                        selectCalculatorCorridor(corridorId);
                        document.getElementById("simulateur")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      aria-label={t("destAria", { country: d.name })}
                      className="group flex h-full items-center gap-3 rounded-2xl border border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
                    >
                      <span className="flex shrink-0 items-center gap-1">
                        <CountryFlag code={d.source} size={28} title="" className="rounded-md" />
                        <CountryFlag code={d.code} size={28} title="" className="rounded-md" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-sm font-semibold leading-snug text-ink [overflow-wrap:anywhere]">
                          {d.name}
                        </span>
                        <span className="block text-xs text-muted">
                          {d.currency} · {d.modes === 1 ? t("destMode") : t("destModes", { n: d.modes })}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
                        <span className="hidden sm:inline">{t("destSimulate")}</span>
                        <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex justify-center">
              <ButtonLink href="/pays" variant="secondary">
                <Icon name="globe" className="h-4 w-4" />
                {t("destAll")}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </Section>

      <FeatureGrid
        id="securite"
        tone="dark"
        columns={4}
        eyebrow={t("secEyebrow")}
        title={t("secTitle")}
        subtitle={t("secSubtitle")}
        items={range(4).map((i) => ({
          icon: SEC_ICONS[i - 1],
          title: k(`sec${i}Title`),
          text: k(`sec${i}Text`),
        }))}
      />

      <Faq
        id="faq"
        eyebrow={m("faqEyebrow")}
        title={t("faqTitle")}
        subtitle={m("faqSubtitle")}
        items={range(6).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <FinalBand />
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Hero() {
  const t = useT(transferPage);
  const chips: { icon: IconName; label: string }[] = [
    { icon: "receipt", label: t("hl1") },
    { icon: "wallet", label: t("hl2") },
    { icon: "clock", label: t("hl3") },
  ];
  return (
    <section className="bg-navy-gradient relative isolate overflow-hidden text-white">
      <Container className="relative grid grid-cols-1 items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-14 lg:pb-24 lg:pt-20">
        <div className="animate-rise min-w-0">
          <h1 className="font-display text-[2.2rem] font-medium leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {t("heroTitleA")} <span className="text-sky">{t("heroTitleB")}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">{t("heroLead")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AppDownloadButton variant="white" size="lg" />
            <ButtonLink href="#simulateur" variant="outline-light" size="lg">
              {t("heroCta2")}
            </ButtonLink>
          </div>
          <p className="mt-8 flex max-w-xl flex-wrap gap-x-5 gap-y-1 text-sm text-white/60">
            {chips.map((c) => (
              <span key={c.icon}>{c.label}</span>
            ))}
          </p>
        </div>
        <div className="animate-rise-2 relative mx-auto w-full max-w-md lg:max-w-none">
          <TransferCalculator id="simulateur" />
        </div>
      </Container>
    </section>
  );
}

function PayoutCard({
  icon,
  title,
  text,
  count,
  chips,
}: {
  icon: IconName;
  title: string;
  text: string;
  count: string;
  chips?: { label: string; id: string }[];
}) {
  return (
    <li className="flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <span className="rounded-full bg-surface-soft px-2.5 py-1 text-xs font-semibold text-muted">{count}</span>
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
      {chips && chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <li
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/15 bg-brand-soft/60 py-1 pl-1 pr-2.5 text-xs font-semibold text-brand-strong"
            >
              <PaymentLogo id={c.id} size={16} title="" />
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function FinalBand() {
  const t = useT(transferPage);
  return (
    <section className="px-5 pb-16 sm:px-6 sm:pb-20">
      <div className="bg-navy-gradient relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] px-6 py-12 text-white shadow-float sm:px-12 sm:py-16">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow light>WorldSoft Transfer</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("ctaTitle")}</h2>
            <p className="mt-3 text-lg text-white/80">{t("ctaText")}</p>
            <div className="mt-6">
              <StoreBadges dark />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <AppDownloadButton variant="white" size="lg" />
            <ButtonLink href="/application" variant="outline-light" size="lg">
              {t("ctaApp")}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { TransferCalculator } from "@/components/transfer/transfer-calculator";
import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { getDestinationCountries } from "@/lib/corridors";
import { useT } from "@/i18n/define";
import { marketing, transferPage } from "@/i18n/services";
import { Audience, CtaBand, Faq, FeatureGrid, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof transferPage.fr;

const OFFER_ICONS: IconName[] = ["phone", "card", "wallet", "clock", "receipt", "lock"];
const COMMIT_ICONS: IconName[] = ["sparkle", "shield", "users", "check"];
const MAX_DESTINATIONS = 12;

export function TransferContent() {
  const t = useT(transferPage);
  const m = useT(marketing);
  const { locale } = useI18n();
  const k = (key: string) => t(key as K);

  const destinations = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    return getDestinationCountries()
      .slice(0, MAX_DESTINATIONS)
      .map((c) => ({
        code: c.code,
        name: names?.of(c.code) ?? c.name,
        currency: c.currency,
        modes: c.networks.length,
      }));
  }, [locale]);

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: "/send", label: t("heroCta") }}
        secondary={{ href: "#destinations", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="transfer"
      />

      {/* Simulateur */}
      <Section id="simulateur" className="scroll-mt-20 bg-surface-soft">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <SectionHeading eyebrow={t("calcEyebrow")} title={t("calcTitle")} subtitle={t("calcSubtitle")} />
              <ul className="mt-8 grid gap-3">
                {(["calcPoint1", "calcPoint2", "calcPoint3"] as const).map((key) => (
                  <li key={key} className="flex items-center gap-3 text-sm font-medium text-ink sm:text-base">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <TransferCalculator />
            </div>
          </div>
        </Container>
      </Section>

      <FeatureGrid
        id="services"
        eyebrow={m("offerEyebrow")}
        title={t("offerTitle")}
        subtitle={t("offerSubtitle")}
        items={range(6).map((i) => ({
          icon: OFFER_ICONS[i - 1],
          title: k(`offer${i}Title`),
          text: k(`offer${i}Text`),
        }))}
      />

      <Steps
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      {/* Destinations */}
      <Section id="destinations" className="scroll-mt-20">
        <Container>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow={t("destEyebrow")} title={t("destTitle")} subtitle={t("destSubtitle")} />
            <Link
              href="/send"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-strong"
            >
              {t("destAll")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <li key={d.code}>
                <Link
                  href={`/send?corridor=CA-${d.code}`}
                  className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40"
                >
                  <CountryFlag code={d.code} size={40} title={d.name} className="rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-ink">{d.name}</span>
                    <span className="block text-xs text-muted">
                      {d.currency}
                      {d.modes > 0 && <> · {d.modes === 1 ? t("destMode") : t("destModes", { n: d.modes })}</>}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-80 transition group-hover:opacity-100">
                    <span className="sr-only sm:not-sr-only">{t("destSend")}</span>
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Audience
        eyebrow={m("forWhoEyebrow")}
        title={t("whoTitle")}
        subtitle={t("whoSubtitle")}
        items={range(4).map((i) => k(`who${i}`))}
      />

      <FeatureGrid
        tone="dark"
        columns={4}
        eyebrow={m("commitmentsEyebrow")}
        title={t("comTitle")}
        subtitle={t("comSubtitle")}
        items={range(4).map((i) => ({
          icon: COMMIT_ICONS[i - 1],
          title: k(`com${i}Title`),
          text: k(`com${i}Text`),
        }))}
      />

      <Faq
        id="faq"
        eyebrow={m("faqEyebrow")}
        title={m("faqTitle")}
        subtitle={m("faqSubtitle")}
        items={range(5).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: "/send", label: t("heroCta") }}
        secondary={{ href: "/contact?sujet=transfert", label: m("contactUs") }}
      />
    </>
  );
}

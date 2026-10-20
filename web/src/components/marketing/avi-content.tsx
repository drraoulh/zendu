"use client";

import { CountryFlag } from "@/components/country-flag";
import { CheckGrid } from "@/components/journeys/service-blocks";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { marketing } from "@/i18n/services";
import { aviPage } from "@/i18n/pw-services";
import { CtaBand, Faq, Notice, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof aviPage.fr;

const COUNTRIES = ["fr", "be", "de", "it"] as const;
const REQUEST = "/contact?sujet=avi";

export function AviContent() {
  const t = useT(aviPage);
  const m = useT(marketing);
  const k = (key: string) => t(key as K);

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: REQUEST, label: t("heroCta") }}
        secondary={{ href: "#etapes", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="plane"
      />

      <Section>
        <Container>
          <SectionHeading eyebrow={t("countriesEyebrow")} title={t("countriesTitle")} subtitle={t("countriesSubtitle")} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((c) => (
              <li key={c} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <CountryFlag code={c.toUpperCase()} size={44} title="" className="rounded-lg" />
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{k(c)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{k(`${c}Text`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Steps
        id="etapes"
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:gap-14">
            <div>
              <SectionHeading eyebrow={t("docsEyebrow")} title={t("docsTitle")} subtitle={t("docsSubtitle")} />
              <div className="mt-8">
                <Notice title={t("noticeTitle")}>{t("noticeText")}</Notice>
              </div>
            </div>
            <CheckGrid items={range(6).map((i) => k(`doc${i}`))} />
          </div>
        </Container>
      </Section>

      <Faq
        id="faq"
        eyebrow={m("faqEyebrow")}
        title={m("faqTitle")}
        subtitle={m("faqSubtitle")}
        items={range(4).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: REQUEST, label: t("heroCta") }}
        secondary={{ href: "/contact", label: m("contactUs") }}
      />
    </>
  );
}

"use client";

import { CountryFlag } from "@/components/country-flag";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { marketing } from "@/i18n/services";
import { suppliersPage } from "@/i18n/pw-services";
import { Audience, CtaBand, Faq, Notice, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof suppliersPage.fr;

const ZONE_FLAGS = ["CN", "EU", "CA", "US"];
const MODE_ICONS: IconName[] = ["card", "users"];
const REQUEST = "/contact?sujet=fournisseurs";

export function SuppliersContent() {
  const t = useT(suppliersPage);
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
        icon="wallet"
      />

      <Section>
        <Container>
          <SectionHeading eyebrow={t("zonesEyebrow")} title={t("zonesTitle")} subtitle={t("zonesSubtitle")} />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {range(4).map((i) => (
              <li key={i} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <CountryFlag code={ZONE_FLAGS[i - 1]} size={44} title="" className="rounded-lg" />
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{k(`zone${i}Title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{k(`zone${i}Text`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="bg-surface-soft">
        <Container>
          <SectionHeading eyebrow={t("modesEyebrow")} title={t("modesTitle")} />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {range(2).map((i) => (
              <article
                key={i}
                className={`rounded-3xl p-7 shadow-card sm:p-8 ${i === 1 ? "bg-navy-gradient text-white" : "border border-line bg-white"}`}
              >
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${i === 1 ? "bg-white/10 text-sky" : "bg-brand-soft text-brand"}`}>
                  <Icon name={MODE_ICONS[i - 1]} className="h-7 w-7" />
                </span>
                <h3 className={`mt-6 font-display text-xl font-bold ${i === 1 ? "" : "text-ink"}`}>{k(`mode${i}Title`)}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${i === 1 ? "text-white/75" : "text-muted"}`}>{k(`mode${i}Text`)}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Steps
        id="etapes"
        tone="light"
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      <Audience
        eyebrow={m("forWhoEyebrow")}
        title={t("whoTitle")}
        subtitle={t("whoSubtitle")}
        items={range(4).map((i) => k(`who${i}`))}
        aside={
          <Notice title={t("noticeTitle")} icon="shield">
            {t("noticeText")}
          </Notice>
        }
      />

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

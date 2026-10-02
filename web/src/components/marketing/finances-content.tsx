"use client";

import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { DetailedOffers } from "@/components/journeys/service-blocks";
import { company } from "@/lib/company";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";
import { financesPage, marketing } from "@/i18n/services";
import { Audience, CtaBand, Faq, FeatureGrid, Notice, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof financesPage.fr;

const BOOK = "/finances/rendez-vous";
const OFFER_ICONS: IconName[] = ["chart", "wallet", "finance", "globe", "sparkle", "receipt"];
const COMMIT_ICONS: IconName[] = ["users", "lock", "info", "shield"];

export function FinancesContent() {
  const t = useT(financesPage);
  const m = useT(marketing);
  const c = useT(common);
  const k = (key: string) => t(key as K);

  // Le format « en personne » n'est proposé que si une adresse est configurée.
  const formats: { icon: IconName; title: string; text: string }[] = [
    { icon: "tech", title: t("pract1Title"), text: t("pract1Text") },
    { icon: "phone", title: t("pract2Title"), text: t("pract2Text") },
    ...(company.address ? [{ icon: "pin" as const, title: t("pract3Title"), text: t("pract3Text") }] : []),
  ];

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: BOOK, label: t("heroCta") }}
        secondary={{ href: "#services", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="finance"
      />

      <DetailedOffers
        id="services"
        eyebrow={m("offerEyebrow")}
        title={t("offerTitle")}
        subtitle={t("offerSubtitle")}
        items={range(6).map((i) => ({
          icon: OFFER_ICONS[i - 1],
          title: k(`offer${i}Title`),
          text: k(`offer${i}Text`),
          points: [k(`d${i}a`), k(`d${i}b`), k(`d${i}c`)],
        }))}
        footer={
          <Notice title={t("disclaimerTitle")} icon="info">
            {t("disclaimerText")}
          </Notice>
        }
      />

      <Audience
        eyebrow={m("forWhoEyebrow")}
        title={t("whoTitle")}
        subtitle={t("whoSubtitle")}
        items={range(5).map((i) => k(`who${i}`))}
      />

      <Steps
        id="deroule"
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      {/* Le rendez-vous en pratique */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <div>
              <SectionHeading eyebrow={t("practEyebrow")} title={t("practTitle")} subtitle={t("practSubtitle")} />
              <ul className={`mt-8 grid gap-4 ${formats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {formats.map((f) => (
                  <li key={f.title} className="rounded-3xl border border-line bg-white p-5 shadow-card">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <Icon name={f.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-display text-base font-bold text-ink">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
                  </li>
                ))}
              </ul>
              <ButtonLink href={BOOK} size="lg" className="mt-8 w-full sm:w-auto">
                <Icon name="clock" className="h-4 w-4" />
                {t("bookCta")}
              </ButtonLink>
            </div>
            <div className="rounded-3xl bg-surface-soft p-6 sm:p-8">
              <h3 className="font-display text-lg font-bold text-ink">{t("prepTitle")}</h3>
              <ul className="mt-5 grid gap-3">
                {range(4).map((i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white">
                      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.8} />
                    </span>
                    {k(`prep${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

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
        items={range(6).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: BOOK, label: t("heroCta") }}
        secondary={{ href: "/contact?sujet=finances", label: c("navContact") }}
      />
    </>
  );
}

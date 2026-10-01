"use client";

import type { IconName } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";
import { financesPage, marketing } from "@/i18n/services";
import { Audience, CtaBand, Faq, FeatureGrid, Notice, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof financesPage.fr;

const OFFER_ICONS: IconName[] = ["chart", "wallet", "finance", "globe", "sparkle", "receipt"];
const COMMIT_ICONS: IconName[] = ["users", "lock", "info", "shield"];

export function FinancesContent() {
  const t = useT(financesPage);
  const m = useT(marketing);
  const c = useT(common);
  const k = (key: string) => t(key as K);

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: "/contact?sujet=finances", label: t("heroCta") }}
        secondary={{ href: "#services", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="finance"
      />

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

      <Container className="-mt-4 mb-16 sm:-mt-6 sm:mb-20">
        <Notice title={t("disclaimerTitle")} icon="info">
          {t("disclaimerText")}
        </Notice>
      </Container>

      <Steps
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      <Audience
        eyebrow={m("forWhoEyebrow")}
        title={t("whoTitle")}
        subtitle={t("whoSubtitle")}
        items={range(5).map((i) => k(`who${i}`))}
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
        items={range(4).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: "/contact?sujet=finances", label: t("heroCta") }}
        secondary={{ href: "/a-propos", label: c("navAbout") }}
      />
    </>
  );
}

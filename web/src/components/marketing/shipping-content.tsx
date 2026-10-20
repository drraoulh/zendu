"use client";

import { Container, Section } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { marketing, shippingPage } from "@/i18n/services";
import { CtaBand, FeatureGrid, Notice, ServiceHero } from "./sections";

const QUOTE = "/shipping/devis";

/** Présentation courte : le shipping relève des activités de PAUL WORLD TRAVEL. */
export function ShippingContent() {
  const t = useT(shippingPage);
  const m = useT(marketing);

  return (
    <>
      <ServiceHero
        eyebrow={t("travelEyebrow")}
        title={t("heroTitle")}
        subtitle={t("travelSubtitle")}
        primary={{ href: QUOTE, label: t("heroCta") }}
        secondary={{ href: "/shipping/suivi", label: t("trackHeroCta") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="box"
      />

      <FeatureGrid
        eyebrow={m("offerEyebrow")}
        title={t("offerTitle")}
        items={[
          { icon: "plane", title: t("offer1Title"), text: t("offer1Text") },
          { icon: "ship", title: t("offer2Title"), text: t("offer2Text") },
          { icon: "pin", title: t("offer5Title"), text: t("offer5Text") },
        ]}
      />

      <Section className="pt-0 sm:pt-0">
        <Container>
          <Notice title={t("travelNoteTitle")}>{t("travelNote")}</Notice>
        </Container>
      </Section>

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: QUOTE, label: t("quoteCta") }}
        secondary={{ href: "/contact?sujet=shipping", label: m("contactUs") }}
      />
    </>
  );
}

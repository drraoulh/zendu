"use client";

import type { IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { marketing, techPage } from "@/i18n/services";
import { Audience, CtaBand, Faq, FeatureGrid, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof techPage.fr;

const OFFER_ICONS: IconName[] = ["code", "card", "tech", "shield", "users"];
const COMMIT_ICONS: IconName[] = ["star", "lock", "sparkle", "globe"];

/** Petite illustration « fenêtre de code » en CSS/SVG pour la section « Pour qui ». */
function CodeWindow() {
  return (
    <div aria-hidden className="bg-navy-gradient overflow-hidden rounded-3xl p-5 shadow-float">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-maple/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
      </div>
      <pre className="mt-4 whitespace-pre-wrap break-words font-mono text-[0.72rem] leading-6 text-white/80 sm:text-xs">
        <span className="text-sky">const</span> projet = {"{"}
        {"\n"}  client: <span className="text-success">&quot;vous&quot;</span>,
        {"\n"}  web: <span className="text-sky">true</span>, mobile: <span className="text-sky">true</span>,
        {"\n"}  paiements: [<span className="text-success">&quot;carte&quot;</span>, <span className="text-success">&quot;mobile money&quot;</span>],
        {"\n"}  sécurité: <span className="text-success">&quot;dès la conception&quot;</span>,
        {"\n"}{"}"};
      </pre>
    </div>
  );
}

export function TechnologiesContent() {
  const t = useT(techPage);
  const m = useT(marketing);
  const k = (key: string) => t(key as K);

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: "/contact?sujet=technologies", label: t("heroCta") }}
        secondary={{ href: "#methode", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="code"
      />

      <FeatureGrid
        id="services"
        eyebrow={m("offerEyebrow")}
        title={t("offerTitle")}
        subtitle={t("offerSubtitle")}
        items={range(5).map((i) => ({
          icon: OFFER_ICONS[i - 1],
          title: k(`offer${i}Title`),
          text: k(`offer${i}Text`),
        }))}
      />

      <Steps
        id="methode"
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
        aside={<CodeWindow />}
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
        primary={{ href: "/contact?sujet=technologies", label: t("heroCta") }}
        secondary={{ href: "#methode", label: t("heroCta2") }}
      />
    </>
  );
}

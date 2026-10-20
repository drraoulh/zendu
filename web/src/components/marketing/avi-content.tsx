"use client";

import Image from "next/image";
import { CountryFlag } from "@/components/country-flag";
import { Icon } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { marketing } from "@/i18n/services";
import { aviPage } from "@/i18n/pw-services";
import { CtaBand, Faq, Notice, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof aviPage.fr;

const COUNTRIES = ["fr", "be", "de", "it"] as const;
/** Une photo par pièce, dans l'ordre des textes doc1 à doc6. */
const DOC_IMAGES = ["passport", "admission", "dates", "guarantor", "contact", "funds"];
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
        image={{ src: "/images/avi.jpg", alt: t("heroEyebrow") }}
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
          <SectionHeading eyebrow={t("docsEyebrow")} title={t("docsTitle")} subtitle={t("docsSubtitle")} />
          <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {DOC_IMAGES.map((img, idx) => (
              <li key={img} className="group">
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-soft">
                  <Image src={`/images/avi/${img}.jpg`} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="zoom-on-hover object-cover" />
                  <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white font-display text-sm font-bold text-ink">
                    {idx + 1}
                  </span>
                </div>
                <p className="mt-4 flex items-start gap-2.5 font-display text-lg font-bold text-ink">
                  <Icon name="check" className="mt-1 h-5 w-5 shrink-0 text-brand" strokeWidth={2.4} />
                  {k(`doc${idx + 1}`)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 max-w-3xl">
            <Notice title={t("noticeTitle")}>{t("noticeText")}</Notice>
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

"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, Container, Section, SectionHeading } from "@/components/ui/layout";
import { contact } from "@/lib/brand";
import { useT } from "@/i18n/define";
import { marketing, shippingPage } from "@/i18n/services";
import { CtaBand, Faq, FeatureGrid, ServiceHero, Steps, range } from "./sections";
import { ShippingQuoteForm } from "./shipping-quote-form";

type K = keyof typeof shippingPage.fr;

const OFFER_ICONS: IconName[] = ["plane", "ship", "card", "receipt", "pin", "box"];

export function ShippingContent() {
  const t = useT(shippingPage);
  const m = useT(marketing);
  const k = (key: string) => t(key as K);

  const modes = [
    { key: "air", icon: "plane" as const, title: t("airTitle"), tag: t("airTag"), points: [t("air1"), t("air2"), t("air3")] },
    { key: "sea", icon: "ship" as const, title: t("seaTitle"), tag: t("seaTag"), points: [t("sea1"), t("sea2"), t("sea3")] },
  ];

  return (
    <>
      <ServiceHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        primary={{ href: "#devis", label: t("heroCta") }}
        secondary={{ href: "#services", label: t("heroCta2") }}
        highlights={[t("hl1"), t("hl2"), t("hl3")]}
        icon="box"
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

      {/* Aérien vs maritime */}
      <Section className="bg-surface-soft">
        <Container>
          <SectionHeading eyebrow={t("modesEyebrow")} title={t("modesTitle")} subtitle={t("modesSubtitle")} />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {modes.map((mode, i) => (
              <article
                key={mode.key}
                className={`relative overflow-hidden rounded-3xl p-7 shadow-card sm:p-8 ${
                  i === 0 ? "bg-navy-gradient text-white" : "border border-line bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${
                      i === 0 ? "bg-white/10 text-sky" : "bg-brand-soft text-brand"
                    }`}
                  >
                    <Icon name={mode.icon} className="h-7 w-7" />
                  </span>
                  {i === 0 ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sky">{mode.tag}</span>
                  ) : (
                    <Badge>{mode.tag}</Badge>
                  )}
                </div>
                <h3 className={`mt-6 font-display text-2xl font-extrabold ${i === 0 ? "text-white" : "text-ink"}`}>
                  {mode.title}
                </h3>
                <ul className="mt-5 grid gap-3">
                  {mode.points.map((p) => (
                    <li
                      key={p}
                      className={`flex items-start gap-3 text-sm leading-relaxed ${i === 0 ? "text-white/80" : "text-muted"}`}
                    >
                      <Icon
                        name="check"
                        className={`mt-0.5 h-4 w-4 shrink-0 ${i === 0 ? "text-sky" : "text-brand"}`}
                        strokeWidth={2.6}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Steps
        tone="light"
        eyebrow={m("howEyebrow")}
        title={t("howTitle")}
        subtitle={t("howSubtitle")}
        steps={range(4).map((i) => ({ title: k(`step${i}Title`), text: k(`step${i}Text`) }))}
      />

      {/* Devis */}
      <Section id="devis" className="scroll-mt-20 bg-surface-soft">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-14">
            <div>
              <SectionHeading eyebrow={t("quoteEyebrow")} title={t("quoteTitle")} subtitle={t("quoteSubtitle")} />
              <ul className="mt-8 grid gap-3">
                {(["quotePoint1", "quotePoint2", "quotePoint3"] as const).map((key) => (
                  <li key={key} className="flex items-center gap-3 text-sm font-medium text-ink">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${contact.email}`}
                className="mt-8 inline-flex items-center gap-2 break-all text-sm font-semibold text-brand hover:text-brand-strong"
              >
                <Icon name="mail" className="h-4 w-4 shrink-0" />
                {contact.email}
              </a>
            </div>
            <div className="rounded-3xl border border-line bg-white p-5 shadow-card sm:p-8">
              <ShippingQuoteForm />
            </div>
          </div>
        </Container>
      </Section>

      {/* Articles interdits */}
      <Section>
        <Container>
          <div className="rounded-3xl border border-warn/30 bg-warn/5 p-6 sm:p-10">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warn/15 text-warn">
                <Icon name="info" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{t("prohibitedTitle")}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{t("prohibitedText")}</p>
              </div>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {range(9).map((i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink shadow-card"
                >
                  <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2.4} />
                  {k(`p${i}`)}
                </li>
              ))}
            </ul>
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
        primary={{ href: "#devis", label: t("heroCta") }}
        secondary={{ href: "/contact?sujet=shipping", label: m("contactUs") }}
      />
    </>
  );
}

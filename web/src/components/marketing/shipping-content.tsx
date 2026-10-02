"use client";

import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge, Container, Section, SectionHeading } from "@/components/ui/layout";
import { CheckGrid, TrackBox } from "@/components/journeys/service-blocks";
import { useT } from "@/i18n/define";
import { marketing, shippingPage } from "@/i18n/services";
import { CtaBand, Faq, FeatureGrid, ServiceHero, Steps, range } from "./sections";

type K = keyof typeof shippingPage.fr;

const OFFER_ICONS: IconName[] = ["plane", "ship", "card", "receipt", "pin", "box"];
const PACK_ICONS: IconName[] = ["box", "shield", "receipt", "info"];
const QUOTE = "/shipping/devis";

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
        primary={{ href: QUOTE, label: t("heroCta") }}
        secondary={{ href: "/shipping/suivi", label: t("trackHeroCta") }}
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

      {/* Comparatif aérien / maritime */}
      <Section className="bg-surface-soft !pt-0">
        <Container>
          <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">{t("cmpTitle")}</h3>
          <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-white shadow-card">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">{t("cmpTitle")}</caption>
              <thead className="bg-surface-soft text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="w-[28%] px-3 py-3 font-semibold sm:px-5">{t("cmpCriteria")}</th>
                  <th scope="col" className="px-3 py-3 font-semibold sm:px-5">
                    <span className="inline-flex items-center gap-1.5 text-ink"><Icon name="plane" className="h-4 w-4 text-brand" />{t("fAir")}</span>
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold sm:px-5">
                    <span className="inline-flex items-center gap-1.5 text-ink"><Icon name="ship" className="h-4 w-4 text-brand" />{t("fSea")}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(["Speed", "Cost", "Best", "Price"] as const).map((row) => (
                  <tr key={row}>
                    <th scope="row" className="px-3 py-3 align-top font-semibold text-ink sm:px-5">{k(`cmp${row}`)}</th>
                    <td className="break-words px-3 py-3 align-top text-muted sm:px-5">{k(`cmp${row}Air`)}</td>
                    <td className="break-words px-3 py-3 align-top text-muted sm:px-5">{k(`cmp${row}Sea`)}</td>
                  </tr>
                ))}
                <tr>
                  <th scope="row" className="px-3 py-3 align-top font-semibold text-ink sm:px-5">{t("cmpDelay")}</th>
                  <td colSpan={2} className="px-3 py-3 align-top text-muted sm:px-5">{t("cmpDelayBoth")}</td>
                </tr>
              </tbody>
            </table>
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

      {/* Devis + suivi */}
      <Section id="devis" className="scroll-mt-20 bg-surface-soft">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
              <SectionHeading eyebrow={t("quoteEyebrow")} title={t("quoteTitle")} subtitle={t("quoteSubtitle")} />
              <ul className="mt-6 grid gap-3">
                {(["quotePoint1", "quotePoint2", "quotePoint3"] as const).map((key) => (
                  <li key={key} className="flex items-center gap-3 text-sm font-medium text-ink">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
              <ButtonLink href={QUOTE} size="lg" className="mt-8 w-full sm:w-auto">
                {t("quoteCta")}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
            </div>
            <TrackBox title={t("trackTitle")} text={t("trackText")} label={t("trackLabel")} placeholder={t("trackPh")} />
          </div>
        </Container>
      </Section>

      {/* Ce qu'on peut envoyer */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:gap-14">
            <SectionHeading title={t("allowedTitle")} subtitle={t("allowedText")} />
            <CheckGrid tone="success" items={range(6).map((i) => k(`a${i}`))} />
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

      <FeatureGrid
        tone="soft"
        columns={4}
        eyebrow={t("packEyebrow")}
        title={t("packTitle")}
        subtitle={t("packSubtitle")}
        items={range(4).map((i) => ({
          icon: PACK_ICONS[i - 1],
          title: k(`pack${i}Title`),
          text: k(`pack${i}Text`),
        }))}
      />

      <Section>
        <Container>
          <div className="grid gap-8 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name="shield" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{t("customsTitle")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{t("customsText")}</p>
              </div>
            </div>
            <ul className="grid gap-3">
              {range(3).map((i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-surface-soft px-4 py-3 text-sm font-medium text-ink">
                  <Icon name="receipt" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {k(`customs${i}`)}
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
        items={range(6).map((i) => ({ q: k(`faq${i}Q`), a: k(`faq${i}A`) }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: QUOTE, label: t("heroCta") }}
        secondary={{ href: "/shipping/suivi", label: t("trackHeroCta") }}
      />
    </>
  );
}

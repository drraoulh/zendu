"use client";

import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/layout";
import { ArrowLink, CtaBand, Faq } from "@/components/marketing/sections";
import { useT } from "@/i18n/define";
import { countryPage } from "@/i18n/info";
import type { DestinationInfo } from "./destinations";
import { REGION_OF } from "./regions";
import { useInfoLabels } from "./shared";

type Other = { code: string; name: string; currency: string };

const FACT_COLS: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" };
const TYPE_ICON: Record<string, IconName> = { mobile_money: "phone", bank: "card", cash: "wallet" };

export function CountryContent({
  destination: d,
  others,
  dialCode,
}: {
  destination: DestinationInfo;
  others: Other[];
  dialCode: string;
}) {
  const t = useT(countryPage);
  const L = useInfoLabels();
  const country = L.country(d.code, d.name);
  const currencyName = L.currencyName(d.currency);
  const simulateHref = `/transfert?corridor=${encodeURIComponent(d.corridorId)}#simulateur`;

  const types = Array.from(new Set(d.networks.map((n) => n.type)));
  const hasMobile = types.includes("mobile_money");
  const hasBank = types.includes("bank");
  const hasCash = types.includes("cash");
  const mobileNetworks = d.networks.filter((n) => n.type === "mobile_money").map((n) => n.label);
  const modes = [
    ...(mobileNetworks.length ? [mobileNetworks.join(", ")] : []),
    ...(hasBank ? [L.networkType("bank").toLowerCase()] : []),
    ...(hasCash ? [L.networkType("cash").toLowerCase()] : []),
  ].join(t("modesJoin"));

  const q100 = d.quotes.find((q) => q.sendAmount === 100) ?? d.quotes[0];
  const sameRegion = others.filter((o) => REGION_OF[o.code] === d.region).slice(0, 6);

  const facts: Array<{ icon: IconName; label: string; value: string }> = [
    { icon: "globe", label: t("factCurrency"), value: `${d.currency} · ${currencyName}` },
    ...(hasMobile ? [{ icon: "phone" as IconName, label: t("factMobile"), value: L.delivery(d.deliveryEstimate) }] : []),
    ...(hasBank ? [{ icon: "card" as IconName, label: t("factBank"), value: L.delivery(d.bankEstimate) }] : []),
    {
      icon: "wallet",
      label: t("factLimits"),
      value: t("factLimitsValue", { min: L.money(d.minSend, d.sendCurrency), max: L.money(d.maxSend, d.sendCurrency) }),
    },
    ...(d.rate != null
      ? [{ icon: "chart" as IconName, label: t("factRate"), value: `1 ${d.sendCurrency} ≈ ${L.number(d.rate, 4)} ${d.currency}` }]
      : []),
  ];

  const tips = [
    t("tipName"),
    ...(hasMobile ? [t("tipPhone", { dial: dialCode })] : []),
    ...(hasBank ? [t("tipBank")] : []),
    ...(hasCash ? [t("tipCash")] : []),
    t("tipRef"),
    t("tipScam"),
  ];

  const modeText = (type: string, label: string) =>
    type === "mobile_money" ? t("modeMobileText", { network: label }) : type === "bank" ? t("modeBankText") : t("modeCashText");

  const modesDelays = d.networks.map((n) => `${L.network(n)} — ${L.delivery(n.delivery)}`).join(" ; ");

  const faq = [
    {
      q: t("faq1Q", { country }),
      a: hasMobile
        ? t("faq1A", { mobile: L.delivery(d.deliveryEstimate).toLowerCase(), bank: L.delivery(d.bankEstimate).toLowerCase() })
        : t("faq1AnoMobile", { modesDelays }),
    },
    ...(q100
      ? [
          {
            q: t("faq2Q", { country }),
            a: t("faq2A", { amount: L.money(q100.sendAmount, d.sendCurrency), fee: L.money(q100.fee, d.sendCurrency) }),
          },
        ]
      : []),
    { q: t("faq3Q"), a: t("faq3A", { currency: d.currency, currencyName }) },
    { q: t("faq4Q", { country }), a: t("faq4A", { networks: d.networks.map((n) => L.network(n)).join(", ") }) },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <>
      {/* En-tête */}
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="text-sm text-white/65">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/pays" className="hover:text-white">
                  {t("breadcrumb")}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="font-semibold text-white">
                {country}
              </li>
            </ol>
          </nav>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow light>{t("heroEyebrow", { country })}</Eyebrow>
              <div className="mt-4 flex items-center gap-4">
                <CountryFlag code={d.code} size={56} title={country} className="rounded-md ring-2 ring-white/20" />
                <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                  {t("heroTitle", { country })}
                </h1>
              </div>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
                {t("heroSubtitle", { currency: d.currency, currencyName, modes })}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <ButtonLink href={simulateHref} variant="white" size="lg">
                {L.t("simulateTo", { country })}
                <Icon name="arrowRight" className="h-4 w-4" />
              </ButtonLink>
              <AppDownloadButton corridor={d.corridorId} variant="outline-light" size="lg" />
            </div>
          </div>
        </Container>
      </section>

      {/* Chiffres clés */}
      <Container className="relative -mt-px">
        <dl className={`grid gap-3 py-8 sm:grid-cols-2 ${FACT_COLS[facts.length] ?? "lg:grid-cols-4"}`}>
          {facts.map((f) => (
            <div key={f.label} className="rounded-3xl border border-line bg-white p-5 shadow-card">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <Icon name={f.icon} className="h-4 w-4 text-brand" />
                {f.label}
              </dt>
              <dd className="mt-2 font-display text-base font-bold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      {/* Modes de réception */}
      <Section className="pt-6 sm:pt-8">
        <Container>
          <SectionHeading eyebrow={t("modesEyebrow")} title={t("modesTitle")} />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.networks.map((n) => (
              <li key={n.id} className="flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${
                    n.type === "mobile_money" ? "bg-brand text-white" : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon name={TYPE_ICON[n.type] ?? "wallet"} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{L.network(n)}</h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">{L.networkType(n.type)}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{modeText(n.type, n.label)}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Icon name="clock" className="h-3.5 w-3.5 text-brand" />
                  {t("modeDelivery", { d: L.delivery(n.delivery) })}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Frais pour montants types */}
      <Section className="bg-surface-soft">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
            <div>
              <SectionHeading eyebrow={t("feesEyebrow")} title={t("feesTitle")} subtitle={t("feesSubtitle")} />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <ButtonLink href={simulateHref} size="md">
                  {L.t("simulateTo", { country })}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink href="/frais#destinations" variant="secondary" size="md">
                  {t("feesMore")}
                </ButtonLink>
              </div>
            </div>
            {d.quotes.length ? (
              <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t("feesTitle")}</caption>
                  <thead className="bg-surface-soft text-xs font-bold uppercase tracking-wider text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 sm:px-5">{t("colSend")}</th>
                      <th scope="col" className="px-2 py-3 sm:px-3">{t("colFee")}</th>
                      <th scope="col" className="hidden px-3 py-3 sm:table-cell">{t("colTotal")}</th>
                      <th scope="col" className="px-4 py-3 text-right sm:px-5">{t("colReceive")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {d.quotes.map((q) => (
                      <tr key={q.sendAmount}>
                        <th scope="row" className="px-4 py-4 font-semibold text-ink sm:px-5">{L.money(q.sendAmount, d.sendCurrency)}</th>
                        <td className="px-2 py-4 text-ink sm:px-3">
                          {L.money(q.fee, d.sendCurrency)}
                          <span className="block text-xs text-muted sm:hidden">= {L.money(q.total, d.sendCurrency)}</span>
                        </td>
                        <td className="hidden px-3 py-4 text-ink sm:table-cell">{L.money(q.total, d.sendCurrency)}</td>
                        <td className="px-4 py-4 text-right font-display font-bold text-brand-strong sm:px-5">
                          {L.money(q.receiveAmount, d.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-line px-5 py-3 text-xs text-muted">{L.t("indicative")}</p>
              </div>
            ) : (
              <p className="rounded-3xl border border-line bg-white p-6 text-sm text-muted">{t("feesUnavailable")}</p>
            )}
          </div>
        </Container>
      </Section>

      {/* Banques + conseils */}
      <Section>
        <Container>
          <div className={`grid gap-6 ${hasBank && d.banks.length ? "lg:grid-cols-2" : ""}`}>
            {hasBank && d.banks.length > 0 && (
              <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
                <Eyebrow>{t("banksEyebrow")}</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">{t("banksTitle", { country })}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t("banksText")}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {d.banks.map((b) => (
                    <li key={b} className="rounded-full border border-line bg-surface-soft px-3 py-1.5 text-sm text-ink">
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            )}
            <article className="bg-navy-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-float sm:p-8">
              <div aria-hidden className="bg-grid absolute inset-0 opacity-30" />
              <div className="relative">
                <Eyebrow light>{t("tipsEyebrow")}</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-extrabold">{t("tipsTitle")}</h2>
                <ul className="mt-5 grid gap-3">
                  {tips.map((tip) => (
                    <li key={tip} className="flex gap-3 text-sm leading-relaxed text-white/80">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sky/20 text-sky">
                        <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </div>
        </Container>
      </Section>

      <Faq eyebrow={t("faqEyebrow", { country })} title={t("faqTitle")} items={faq} />

      {sameRegion.length > 0 && (
        <Section className="pt-0 sm:pt-0">
          <Container>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow={t("otherEyebrow")} title={t("otherTitle")} />
              <ArrowLink href="/pays">{t("breadcrumb")}</ArrowLink>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sameRegion.map((o) => (
                <li key={o.code}>
                  <Link
                    href={`/pays/${o.code.toLowerCase()}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card transition hover:border-brand/40"
                  >
                    <CountryFlag code={o.code} size={28} title="" />
                    <span className="flex-1 font-semibold text-ink group-hover:text-brand-strong">{L.country(o.code, o.name)}</span>
                    <span className="text-xs text-muted">{o.currency}</span>
                    <Icon name="arrowRight" className="h-4 w-4 text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaBand
        title={t("ctaTitle", { country })}
        text={t("ctaText")}
        primary={{ href: simulateHref, label: L.t("simulateTo", { country }) }}
        secondary={{ href: "/aide", label: t("help") }}
      />
    </>
  );
}

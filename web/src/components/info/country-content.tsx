"use client";

import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Eyebrow, Section, SectionHeading } from "@/components/ui/layout";
import { CtaBand, Faq } from "@/components/marketing/sections";
import { useT } from "@/i18n/define";
import { capitalize, countriesMessages, countryPhrase, groupByDelivery } from "@/i18n/countries";
import type { CountryInfo, DestinationInfo } from "./destinations";
import { useInfoLabels } from "./shared";
import { PaymentLogo } from "@/components/ui/payment-logo";

type Other = { code: string; name: string; currency: string };

const MODE_KEY: Record<string, "modeINTERAC" | "modeALIPAY" | "modeWECHAT" | "modeBANK" | "modeCASH"> = {
  INTERAC: "modeINTERAC",
  ALIPAY: "modeALIPAY",
  WECHAT: "modeWECHAT",
  BANK: "modeBANK",
  CASH: "modeCASH",
};

const simulateHref = (corridorId: string) => `/transfert?corridor=${encodeURIComponent(corridorId)}#simulateur`;

export function CountryContent({ country: c, others }: { country: CountryInfo; others: Other[] }) {
  const t = useT(countriesMessages);
  const L = useInfoLabels();
  const name = L.country(c.code, c.name);
  const { to, in: inCountry } = countryPhrase(L.locale, c.code, name);
  const currencyName = L.currencyName(c.currency);
  const mainInbound = c.inbound[0];

  const modes = c.networks.map((n) => L.network(n)).join(t("modesJoin"));
  const hasBank = c.networks.some((n) => n.type === "bank");
  const modeText = (id: string, label: string) => (MODE_KEY[id] ? t(MODE_KEY[id]) : t("modeMOBILE", { network: label }));

  const example = mainInbound?.quotes[0]
    ? `${L.money(mainInbound.quotes[0].sendAmount, mainInbound.sendCurrency)} → ${L.money(mainInbound.quotes[0].fee, mainInbound.sendCurrency)}`
    : "—";

  const facts: Array<{ icon: IconName; label: string; value: React.ReactNode }> = [
    { icon: "globe", label: t("factCurrency"), value: `${c.currency} · ${currencyName}` },
    { icon: "clock", label: t("factDelivery"), value: groupByDelivery(c.networks, (n) => L.network(n), L.delivery) },
    {
      icon: "transfer",
      label: t("factFrom"),
      value: <FlagList items={c.inbound.map((d) => ({ code: d.sourceCode, name: d.sourceName }))} />,
    },
    {
      icon: "arrowRight",
      label: t("factTo"),
      value: <FlagList items={c.outbound.map((d) => ({ code: d.code, name: d.name }))} />,
    },
  ];

  const tips = [t("tipName"), t("tipPhone", { dial: c.dialCode }), ...(hasBank ? [t("tipBank")] : []), t("tipRef"), t("tipScam")];

  const faq = [
    { q: t("faq1Q", { to }), a: t("faq1A", { modesDelays: c.networks.map((n) => `${L.network(n)} — ${L.delivery(n.delivery)}`).join(" ; ") }) },
    { q: t("faq2Q", { to }), a: t("faq2A", { example }) },
    { q: t("faq3Q"), a: t("faq3A", { currency: c.currency, currencyName }) },
    { q: t("faq4Q"), a: t("faq4A") },
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
                {name}
              </li>
            </ol>
          </nav>
          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Eyebrow light>{t("eyebrow", { country: name })}</Eyebrow>
              <div className="mt-4 flex items-center gap-4">
                <CountryFlag code={c.code} size={56} title={name} className="rounded-md ring-2 ring-white/20" />
                <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t("title", { to })}</h1>
              </div>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
                {t("subtitle", { currency: c.currency, currencyName, modes })}
              </p>
            </div>
            {mainInbound && (
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <ButtonLink href={simulateHref(mainInbound.corridorId)} variant="white" size="lg">
                  {t("simulateTo", { to })}
                  <Icon name="arrowRight" className="h-4 w-4" />
                </ButtonLink>
                <AppDownloadButton corridor={mainInbound.corridorId} variant="outline-light" size="lg" />
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* Chiffres clés */}
      <Container>
        <dl className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4">
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
          <SectionHeading eyebrow={t("modesEyebrow")} title={t("modesTitle", { in: inCountry })} />
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {c.networks.map((n) => (
              <li key={n.id} className="flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card">
                <PaymentLogo id={n.id} size={36} title={L.network(n)} />
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{L.network(n)}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{modeText(n.id, n.label)}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Icon name="clock" className="h-3.5 w-3.5 text-brand" />
                  {t("modeDelivery", { d: L.delivery(n.delivery) })}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Frais pour envoyer vers ce pays, par pays d'envoi */}
      <Section className="bg-surface-soft">
        <Container>
          <SectionHeading eyebrow={t("inboundEyebrow", { to })} title={t("inboundTitle", { to })} subtitle={t("inboundSubtitle")} />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {c.inbound.map((d) => (
              <FeesCard key={d.corridorId} d={d} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Envoyer depuis ce pays */}
      {c.outbound.length > 0 && (
        <Section>
          <Container>
            <SectionHeading
              eyebrow={t("outboundEyebrow", { from: capitalize(countryPhrase(L.locale, c.code, name).from) })}
              title={t("outboundTitle", { in: inCountry })}
              subtitle={t("outboundText", { currency: c.outbound[0].sendCurrency })}
            />
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {c.outbound.map((d) => (
                <li key={d.corridorId}>
                  <Link
                    href={simulateHref(d.corridorId)}
                    className="group flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40"
                  >
                    <CountryFlag code={c.code} size={32} title="" />
                    <Icon name="arrowRight" className="h-4 w-4 text-brand" />
                    <CountryFlag code={d.code} size={32} title="" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-bold text-ink group-hover:text-brand-strong">{L.country(d.code, d.name)}</span>
                      <span className="block text-xs text-muted">
                        {groupByDelivery(d.networks, (n) => L.network(n), L.delivery)}
                      </span>
                    </span>
                    <span className="hidden rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong sm:inline">{t("simulate")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* Banques + conseils */}
      <Section className={c.outbound.length > 0 ? "pt-0 sm:pt-0" : ""}>
        <Container>
          <div className={`grid gap-6 ${hasBank && c.banks.length ? "lg:grid-cols-2" : ""}`}>
            {hasBank && c.banks.length > 0 && (
              <article className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
                <Eyebrow>{t("banksEyebrow")}</Eyebrow>
                <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">{t("banksTitle", { in: inCountry })}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">{t("banksText")}</p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {c.banks.map((b) => (
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

      <Faq eyebrow={name} title={t("faqTitle")} items={faq} />

      {others.length > 0 && (
        <Section className="pt-0 sm:pt-0">
          <Container>
            <SectionHeading title={t("otherTitle")} />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {others.map((o) => (
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
        title={t("countryCtaTitle", { to })}
        text={t("countryCtaText")}
        primary={{ href: mainInbound ? simulateHref(mainInbound.corridorId) : "/#simulateur", label: t("simulateTo", { to }) }}
        secondary={{ href: "/aide", label: t("help") }}
      />
    </>
  );
}

function FlagList({ items }: { items: Array<{ code: string; name: string }> }) {
  const L = useInfoLabels();
  return (
    <span className="flex flex-wrap items-center gap-2">
      {items.map((i) => (
        <span key={i.code} className="inline-flex items-center gap-1.5 text-sm">
          <CountryFlag code={i.code} size={20} title="" />
          {L.country(i.code, i.name)}
        </span>
      ))}
    </span>
  );
}

function FeesCard({ d }: { d: DestinationInfo }) {
  const t = useT(countriesMessages);
  const L = useInfoLabels();
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <p className="flex items-center gap-2 font-display font-bold text-ink">
          <CountryFlag code={d.sourceCode} size={24} title="" />
          {t("fromCountry", { from: capitalize(countryPhrase(L.locale, d.sourceCode, L.country(d.sourceCode, d.sourceName)).from) })}
        </p>
        <Link
          href={simulateHref(d.corridorId)}
          className="inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand hover:text-white"
        >
          {t("simulate")}
          <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </Link>
      </div>
      {d.quotes.length ? (
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t("fromCountry", { from: capitalize(countryPhrase(L.locale, d.sourceCode, L.country(d.sourceCode, d.sourceName)).from) })}</caption>
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
                <td className="px-4 py-4 text-right font-display font-bold text-brand-strong sm:px-5">{L.money(q.receiveAmount, d.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="p-6 text-sm text-muted">{t("feesUnavailable")}</p>
      )}
      <p className="border-t border-line px-5 py-3 text-xs text-muted">
        {d.rate != null ? `1 ${d.sendCurrency} ≈ ${L.number(d.rate, 6)} ${d.currency} · ` : ""}
        {L.t("indicative")}
      </p>
    </div>
  );
}

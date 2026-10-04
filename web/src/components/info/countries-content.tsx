"use client";

import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import { Icon } from "@/components/ui/icon";
import { Container, PageHero, Section } from "@/components/ui/layout";
import { ArrowLink, CtaBand } from "@/components/marketing/sections";
import { useT } from "@/i18n/define";
import { countriesMessages } from "@/i18n/countries";
import type { CountryInfo } from "./destinations";
import { useInfoLabels } from "./shared";

export function CountriesContent({ countries }: { countries: CountryInfo[] }) {
  const t = useT(countriesMessages);
  const L = useInfoLabels();
  const routes = countries.reduce((n, c) => n + c.outbound.length, 0);

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <div className="flex flex-wrap items-center gap-3">
          {countries.map((c, i) => (
            <span key={c.code} className="inline-flex items-center gap-2">
              {i > 0 && <Icon name="transfer" className="h-4 w-4 text-sky" />}
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15">
                <CountryFlag code={c.code} size={20} title="" />
                {L.country(c.code, c.name)}
              </span>
            </span>
          ))}
        </div>
      </PageHero>

      <Section className="pt-10 sm:pt-12">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-muted">{t("routesCount", { n: routes })}</p>
            <ArrowLink href="/frais#destinations">{t("feesLink")}</ArrowLink>
          </div>

          <ul className="mt-8 grid gap-5 lg:grid-cols-3">
            {countries.map((c) => (
              <li key={c.code}>
                <Link
                  href={`/pays/${c.code.toLowerCase()}`}
                  className="group flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                >
                  <div className="flex items-center gap-4">
                    <CountryFlag code={c.code} size={52} title="" className="rounded-md" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-xl font-extrabold text-ink group-hover:text-brand-strong">
                        {L.country(c.code, c.name)}
                      </h2>
                      <p className="text-sm text-muted">{t("currency", { c: `${c.currency} · ${L.currencyName(c.currency)}` })}</p>
                    </div>
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-wider text-muted">{t("receiveWith")}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {c.networks.map((n) => (
                      <li
                        key={n.id}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          n.type === "mobile_money" ? "bg-brand-soft text-brand-strong" : "bg-surface-soft text-ink/80"
                        }`}
                      >
                        {L.network(n)}
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-surface-soft p-4 text-sm">
                    <div>
                      <dt className="text-xs text-muted">{t("receiveFrom")}</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.inbound.map((d) => (
                          <CountryFlag key={d.sourceCode} code={d.sourceCode} size={24} title={L.country(d.sourceCode, d.sourceName)} />
                        ))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">{t("sendTo")}</dt>
                      <dd className="mt-1.5 flex flex-wrap gap-1.5">
                        {c.outbound.map((d) => (
                          <CountryFlag key={d.code} code={d.code} size={24} title={L.country(d.code, d.name)} />
                        ))}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-brand">
                    {t("seeCountry")}
                    <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm text-muted">{t("soon")}</p>
        </Container>
      </Section>

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: "/contact?sujet=transfert", label: t("ctaContact") }}
        secondary={{ href: "/frais", label: t("ctaFees") }}
      />
    </>
  );
}

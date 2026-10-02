"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CountryFlag } from "@/components/country-flag";
import { Icon } from "@/components/ui/icon";
import { Container, PageHero, Section } from "@/components/ui/layout";
import { ArrowLink, CtaBand } from "@/components/marketing/sections";
import { useT } from "@/i18n/define";
import { countriesPage } from "@/i18n/info";
import type { DestinationInfo } from "./destinations";
import { REGION_ORDER } from "./regions";
import { SearchField, normalize, useInfoLabels } from "./shared";

export function CountriesContent({ destinations }: { destinations: DestinationInfo[] }) {
  const t = useT(countriesPage);
  const L = useInfoLabels();
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = normalize(q);
    const match = (d: DestinationInfo) =>
      !needle ||
      normalize(
        [L.country(d.code, d.name), d.name, d.code, d.currency, L.region(d.region), ...d.networks.map((n) => `${n.label} ${L.network(n)}`)].join(" "),
      ).includes(needle);
    return REGION_ORDER.map((region) => ({
      region,
      items: destinations
        .filter((d) => d.region === region && match(d))
        .sort((a, b) => L.country(a.code, a.name).localeCompare(L.country(b.code, b.name), L.locale)),
    })).filter((g) => g.items.length > 0);
  }, [destinations, q, L]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle", { count: destinations.length })} subtitle={t("heroSubtitle")}>
        <SearchField
          id="countries-search"
          label={t("searchLabel")}
          placeholder={t("searchPh")}
          value={q}
          onChange={setQ}
          large
          className="max-w-xl"
        />
      </PageHero>

      <Section className="pt-10 sm:pt-12">
        <Container>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted" aria-live="polite">
              {t("countLabel", { n: total })}
            </p>
            <ArrowLink href="/frais#destinations">{t("feesLink")}</ArrowLink>
          </div>

          {groups.length === 0 && (
            <p className="mt-8 rounded-3xl border border-line bg-surface-soft p-8 text-center text-sm text-muted">
              {L.t("noResults", { q })}
            </p>
          )}

          <div className="mt-8 grid gap-12">
            {groups.map((g) => (
              <section key={g.region} aria-labelledby={`region-${g.region}`}>
                <h2 id={`region-${g.region}`} className="flex items-center gap-3 font-display text-xl font-extrabold text-ink sm:text-2xl">
                  {L.region(g.region)}
                  <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-muted">{g.items.length}</span>
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((d) => (
                    <li key={d.code}>
                      <Link
                        href={`/pays/${d.code.toLowerCase()}`}
                        className="group flex h-full flex-col rounded-3xl border border-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                      >
                        <div className="flex items-center gap-3">
                          <CountryFlag code={d.code} size={36} title="" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-display text-base font-bold text-ink group-hover:text-brand-strong">
                              {L.country(d.code, d.name)}
                            </p>
                            <p className="text-xs text-muted">{t("currency", { c: d.currency })}</p>
                          </div>
                          <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
                        </div>
                        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={L.t("seeCountry")}>
                          {d.networks.map((n) => (
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
                        <p className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs text-muted">
                          <Icon name="clock" className="h-3.5 w-3.5 text-brand" />
                          {L.delivery(d.deliveryEstimate)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
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

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CountryFlag } from "@/components/country-flag";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, PageHero, Section, SectionHeading } from "@/components/ui/layout";
import { CtaBand, Faq, Notice } from "@/components/marketing/sections";
import { useT } from "@/i18n/define";
import { feesPage } from "@/i18n/info";
import { capitalize, countryPhrase, groupByDelivery } from "@/i18n/countries";
import type { DestinationInfo } from "./destinations";
import { useInfoLabels } from "./shared";
import { PaymentLogo } from "@/components/ui/payment-logo";

export function FeesContent({ destinations }: { destinations: DestinationInfo[] }) {
  const t = useT(feesPage);
  const L = useInfoLabels();

  const sample = destinations.find((d) => d.corridorId === "CA-CM") ?? destinations[0];
  const q100 = sample?.quotes[0];
  const sendCurrency = sample?.sendCurrency ?? "CAD";
  const flat = q100 ? L.money(q100.feeFlat, sendCurrency) : "—";
  const percent = q100 ? L.number(q100.feePercent) : "—";
  const margin = sample?.marginPercent != null ? L.number(sample.marginPercent) : "—";

  const fetchedAt = destinations.find((d) => d.fxFetchedAt)?.fxFetchedAt ?? null;
  const allStale = destinations.every((d) => d.fxStale);
  const updated = allStale || !fetchedAt ? t("staleRates") : t("updatedAt", { date: L.date(fetchedAt) });

  /* Un groupe par pays d'envoi, dans l'ordre des pays ouverts. */
  const groups = useMemo(() => {
    const order: string[] = [];
    const bySource = new Map<string, DestinationInfo[]>();
    for (const d of destinations) {
      if (!bySource.has(d.sourceCode)) {
        bySource.set(d.sourceCode, []);
        order.push(d.sourceCode);
      }
      bySource.get(d.sourceCode)!.push(d);
    }
    return order.map((code) => ({ code, items: bySource.get(code)! }));
  }, [destinations]);

  const howItems: Array<{ icon: IconName; title: string; text: string }> = [
    { icon: "receipt", title: t("how1Title"), text: t("how1Text", { flat, percent }) },
    { icon: "chart", title: t("how2Title"), text: t("how2Text", { margin }) },
    { icon: "check", title: t("how3Title"), text: t("how3Text") },
  ];

  const simulateHref = (d: DestinationInfo) => `/transfert?corridor=${encodeURIComponent(d.corridorId)}#simulateur`;

  return (
    <>
      <PageHero eyebrow={t("heroEyebrow")} title={t("heroTitle")} subtitle={t("heroSubtitle")}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/#simulateur" variant="white" size="lg">
            {t("ctaSimulate")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/application" variant="outline-light" size="lg">
            {t("ctaApp")}
          </ButtonLink>
        </div>
      </PageHero>

      {/* Comment sont calculés les frais */}
      <Section>
        <Container>
          <SectionHeading eyebrow={t("howEyebrow")} title={t("howTitle")} subtitle={t("howSubtitle")} />
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
            <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {howItems.map((item, i) => (
                <li key={item.title} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="font-display text-sm font-black text-brand/40">0{i + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </li>
              ))}
            </ol>

            {sample && q100 && (
              <aside className="bg-navy-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-float sm:p-8">
                <div aria-hidden className="bg-grid absolute inset-0 opacity-30" />
                <div className="relative">
                  <p className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.16em] text-sky">
                    <CountryFlag code={sample.sourceCode} size={20} title={L.country(sample.sourceCode, sample.sourceName)} />→
                    <CountryFlag code={sample.code} size={20} title={L.country(sample.code, sample.name)} />
                  </p>
                  <h3 className="mt-3 font-display text-xl font-extrabold">
                    {t("exampleTitle", { amount: L.money(q100.sendAmount, sendCurrency) })}
                  </h3>
                  <dl className="mt-5 grid gap-3 text-sm">
                    <Row label={t("exampleSend")} value={L.money(q100.sendAmount, sendCurrency)} />
                    <Row label={t("exampleFee", { flat, percent })} value={`+ ${L.money(q100.fee, sendCurrency)}`} />
                    <div className="border-t border-white/15" />
                    <Row label={t("exampleTotal")} value={L.money(q100.total, sendCurrency)} strong />
                    <Row label={t("exampleRate")} value={t("rateLine", { from: sendCurrency, rate: L.number(q100.rate, 4), to: sample.currency })} />
                    <Row
                      label={t("exampleReceive", { country: L.country(sample.code, sample.name) })}
                      value={L.money(q100.receiveAmount, sample.currency)}
                      strong
                    />
                  </dl>
                  <p className="mt-5 text-xs text-white/60">{L.t("indicative")}</p>
                </div>
              </aside>
            )}
          </div>
        </Container>
      </Section>

      {/* Tableaux par pays d'envoi */}
      <Section id="destinations" className="scroll-mt-20 bg-surface-soft">
        <Container>
          <SectionHeading
            eyebrow={t("tableEyebrow")}
            title={t("tableTitle", { count: destinations.length })}
            subtitle={t("tableSubtitle")}
          />

          <div className="mt-10 grid gap-10">
            {groups.map((g) => {
              const first = g.items[0];
              const amounts = first.quotes.map((q) => q.sendAmount);
              const sourceName = capitalize(countryPhrase(L.locale, g.code, L.country(g.code, first.sourceName)).from);
              return (
                <section key={g.code} aria-labelledby={`from-${g.code}`}>
                  <div className="flex items-center gap-3">
                    <CountryFlag code={g.code} size={36} title="" className="rounded-md" />
                    <div>
                      <h3 id={`from-${g.code}`} className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                        {sourceName}
                      </h3>
                      <p className="text-sm text-muted">{t("fromSubtitle", { currency: first.sendCurrency })}</p>
                    </div>
                  </div>

                  {/* Grand écran : tableau */}
                  <div className="mt-5 hidden overflow-hidden rounded-3xl border border-line bg-white shadow-card lg:block">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">{sourceName}</caption>
                      <thead className="bg-surface-soft text-xs font-bold uppercase tracking-wider text-muted">
                        <tr>
                          <th scope="col" className="px-5 py-4">{t("colRoute")}</th>
                          <th scope="col" className="px-3 py-4">{t("colModes")}</th>
                          <th scope="col" className="px-3 py-4">{t("colDelivery")}</th>
                          {amounts.map((a) => (
                            <th key={a} scope="col" className="px-3 py-4">
                              {t("colFee", { amount: L.money(a, first.sendCurrency) })}
                            </th>
                          ))}
                          <th scope="col" className="px-3 py-4">{t("colLimits")}</th>
                          <th scope="col" className="px-5 py-4"><span className="sr-only">{t("colAction")}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {g.items.map((d) => (
                          <tr key={d.corridorId} className="align-top transition hover:bg-brand-soft/30">
                            <th scope="row" className="px-5 py-4 font-normal">
                              <Link href={`/pays/${d.code.toLowerCase()}`} className="group flex items-center gap-3">
                                <CountryFlag code={d.code} size={28} title={L.country(d.code, d.name)} />
                                <span>
                                  <span className="block font-semibold text-ink group-hover:text-brand-strong">{L.country(d.code, d.name)}</span>
                                  <span className="block text-xs text-muted">{t("rateLine", { from: d.sendCurrency, rate: d.rate != null ? L.number(d.rate, 4) : "—", to: d.currency })}</span>
                                </span>
                              </Link>
                            </th>
                            <td className="px-3 py-4"><NetworkChips d={d} /></td>
                            <td className="px-3 py-4 text-xs text-muted"><DeliveryLines d={d} /></td>
                            {d.quotes.map((quote) => (
                              <td key={quote.sendAmount} className="px-3 py-4">
                                <span className="block font-semibold text-ink">{L.money(quote.fee, d.sendCurrency)}</span>
                                <span className="block text-xs text-muted">{t("receiveApprox", { amount: L.money(quote.receiveAmount, d.currency) })}</span>
                              </td>
                            ))}
                            <td className="whitespace-nowrap px-3 py-4 text-xs text-muted">
                              {L.money(d.minSend, d.sendCurrency)} – {L.money(d.maxSend, d.sendCurrency)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={simulateHref(d)}
                                className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand hover:text-white"
                              >
                                {L.t("simulate")}
                                <Icon name="arrowRight" className="h-3.5 w-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / tablette : cartes */}
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:hidden">
                    {g.items.map((d) => (
                      <li key={d.corridorId} className="rounded-3xl border border-line bg-white p-5 shadow-card">
                        <Link href={`/pays/${d.code.toLowerCase()}`} className="flex items-center gap-3">
                          <CountryFlag code={d.code} size={32} title={L.country(d.code, d.name)} />
                          <span className="min-w-0">
                            <span className="block font-display font-bold text-ink">{L.country(d.code, d.name)}</span>
                            <span className="block text-xs text-muted">{t("rateLine", { from: d.sendCurrency, rate: d.rate != null ? L.number(d.rate, 4) : "—", to: d.currency })}</span>
                          </span>
                        </Link>
                        <div className="mt-4"><NetworkChips d={d} /></div>
                        <div className="mt-3 text-xs text-muted"><DeliveryLines d={d} /></div>
                        <dl className="mt-4 grid gap-1.5 rounded-2xl bg-surface-soft p-3 sm:grid-cols-3 sm:gap-2 sm:text-center">
                          {d.quotes.map((quote) => (
                            <div key={quote.sendAmount} className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
                              <dt className="text-xs text-muted sm:text-[11px]">{L.money(quote.sendAmount, d.sendCurrency)}</dt>
                              <dd className="break-words text-sm font-semibold text-ink sm:mt-0.5">{L.money(quote.fee, d.sendCurrency)}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <span className="text-xs text-muted">
                            {t("colLimits")} : {L.money(d.minSend, d.sendCurrency)} – {L.money(d.maxSend, d.sendCurrency)}
                          </span>
                          <Link
                            href={simulateHref(d)}
                            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-strong"
                          >
                            {L.t("simulate")}
                            <Icon name="arrowRight" className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <div className="mt-10">
            <Notice title={t("noticeTitle")} icon="info">
              {t("noticeText", { updated })}
            </Notice>
          </div>
        </Container>
      </Section>

      <Faq
        title={t("faqTitle")}
        items={[1, 2, 3, 4].map((i) => ({
          q: t(`faq${i}Q` as "faq1Q"),
          a: t(`faq${i}A` as "faq1A"),
        }))}
      />

      <CtaBand
        title={t("ctaTitle")}
        text={t("ctaText")}
        primary={{ href: "/#simulateur", label: t("ctaSimulate") }}
        secondary={{ href: "/application", label: t("ctaAppPage") }}
      />
    </>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-white/70">{label}</dt>
      <dd className={`text-right ${strong ? "font-display text-lg font-extrabold text-white" : "font-semibold text-white/90"}`}>{value}</dd>
    </div>
  );
}

function NetworkChips({ d }: { d: DestinationInfo }) {
  const L = useInfoLabels();
  return (
    <ul className="flex flex-wrap gap-1.5">
      {d.networks.map((n) => (
        <li
          key={n.id}
          className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold ${
            n.type === "mobile_money" ? "bg-brand-soft text-brand-strong" : "bg-surface-soft text-ink/80"
          }`}
        >
          <PaymentLogo id={n.id} size={16} title="" />
          {L.network(n)}
        </li>
      ))}
    </ul>
  );
}

function DeliveryLines({ d }: { d: DestinationInfo }) {
  const L = useInfoLabels();
  return <span>{groupByDelivery(d.networks, (n) => L.network(n), L.delivery)}</span>;
}

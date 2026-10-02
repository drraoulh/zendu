"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { CountryFlag } from "@/components/country-flag";
import { WstLogo } from "@/components/brand/wst-logo";
import { StoreBadges } from "@/components/app/store-badges";
import { PhonePreview } from "@/components/app/phone-preview";
import { WaitlistForm } from "@/components/app/waitlist-form";
import { localCountryName, localeTag } from "@/components/app/country-name";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { appAvailable } from "@/lib/app-links";
import { appMessages } from "@/i18n/app";
import { useT } from "@/i18n/define";

export type Simulation = {
  corridor: string;
  amount: number;
  currency: string;
  destCode: string;
  destName: string;
};

export function ApplicationContent({
  qrSvg,
  simulation,
  destinations,
}: {
  qrSvg: string | null;
  simulation: Simulation | null;
  destinations: { code: string; name: string }[];
}) {
  const t = useT(appMessages);
  const { locale } = useI18n();
  const available = appAvailable();

  const amountText = simulation
    ? new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 2 }).format(simulation.amount)
    : null;
  const destName = simulation ? localCountryName(simulation.destCode, locale, simulation.destName) : null;

  const benefits: { icon: IconName; title: string; text: string }[] = [
    { icon: "receipt", title: t("benefitFeesTitle"), text: t("benefitFeesText") },
    { icon: "wallet", title: t("benefitPayoutTitle"), text: t("benefitPayoutText") },
    { icon: "clock", title: t("benefitTrackTitle"), text: t("benefitTrackText") },
  ];

  return (
    <>
      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative grid items-center gap-12 pb-28 pt-12 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:pb-32">
          <div className="animate-rise">
            <WstLogo variant="negative" priority className="h-7 w-auto sm:h-9" />
            <div className="mt-8">
              <Eyebrow light>{t("heroEyebrow")}</Eyebrow>
            </div>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">{t("heroSubtitle")}</p>

            {simulation && amountText && destName && (
              <div className="mt-7 inline-flex max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <CountryFlag code={simulation.destCode} size={28} title={destName} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky">{t("simulationLabel")}</p>
                  <p className="font-display text-lg font-bold">
                    {t("simulationText", { amount: amountText, currency: simulation.currency, country: destName })}
                  </p>
                </div>
              </div>
            )}

            <StoreBadges dark className="mt-8" />
          </div>

          <div className="animate-rise-1 flex justify-center lg:justify-end">
            <PhonePreview
              amountLabel={simulation && amountText ? `${amountText} ${simulation.currency}` : undefined}
              destLabel={destName ?? undefined}
            />
          </div>
        </Container>
      </section>

      <Container className="relative -mt-16 sm:-mt-20">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-float sm:p-10">
          <div className={`grid gap-10 ${qrSvg ? "md:grid-cols-[1fr_auto]" : ""}`}>
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t("downloadTitle")}</h2>
              <p className="mt-3 text-muted">{t("downloadText")}</p>

              {simulation && (
                <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-strong">
                  <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("simulationHint")}
                </p>
              )}

              <StoreBadges className="mt-6" />

              {!available && (
                <div className="mt-8 rounded-3xl border border-brand/20 bg-surface-soft p-5 sm:p-6">
                  <p className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.14em] text-brand">
                    <span className="live-dot" aria-hidden />
                    {t("comingSoonTitle")}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t("comingSoonText")}</p>
                  <h3 className="mt-6 font-display text-lg font-bold text-ink">{t("waitlistTitle")}</h3>
                  <div className="relative mt-4">
                    <WaitlistForm destinations={destinations} defaultCountry={simulation?.destCode} />
                  </div>
                </div>
              )}
            </div>

            {qrSvg && (
              <div className="hidden flex-col items-center text-center md:flex md:w-60">
                <div
                  role="img"
                  aria-label={t("qrAlt")}
                  className="h-52 w-52 rounded-3xl border border-line bg-white p-3 shadow-card [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <p className="mt-4 font-display font-bold text-ink">{t("scanTitle")}</p>
                <p className="mt-1 text-sm text-muted">{t("scanText")}</p>
              </div>
            )}
          </div>
        </div>
      </Container>

      <section className="py-16 sm:py-20">
        <Container>
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {t("benefitsTitle")}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-3xl border border-line bg-white p-6 shadow-card">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Icon name={b.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/transfert" className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
              {t("alsoSimulate")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}

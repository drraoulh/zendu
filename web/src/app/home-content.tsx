"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { CountryFlag } from "@/components/country-flag";
import { RemittanceCalculator } from "@/components/remittance-calculator";
import { AppStoreBadges } from "@/components/app-store-badges";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/transfer-machine";
import { getDestinationCountries } from "@/lib/corridors";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Zendu";

type Recent = {
  id: string;
  reference: string;
  status: string;
  receiveAmountXaf: number;
  receiveCurrency: string | null;
  beneficiary: { fullName: string };
};

export function HomeContent({ recent }: { recent: Recent[] }) {
  const { t } = useI18n();
  const destinations = getDestinationCountries();

  return (
    <>
      {/* Hero Remitly-style: copy left + calculator right */}
      <section className="relative isolate overflow-hidden bg-[#0c1f18]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-zendu.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1f18] via-[#0c1f18]/85 to-[#0c1f18]/35" />

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-20 lg:pt-16">
          <div>
            <p className="animate-rise font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {appName}
            </p>
            <h1 className="animate-rise mt-3 max-w-xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              {t("heroTitle")}
            </h1>
            <p className="animate-rise-delay mt-4 max-w-lg text-base text-white/75 sm:text-lg">
              {t("heroSubtitle")}
            </p>
            <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
              <Link
                href="/send"
                className="rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition hover:bg-accent-strong"
              >
                {t("heroCta")}
              </Link>
              <Link
                href="/signup"
                className="rounded-full border border-white/30 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                {t("signUp")}
              </Link>
            </div>
          </div>

          <div className="animate-rise-delay lg:justify-self-end">
            <RemittanceCalculator />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:grid-cols-3">
          <TrustItem title={t("trustSpeed")} />
          <TrustItem title={t("trustFees")} />
          <TrustItem title={t("trustSecure")} />
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {t("recentActivity")}
            </h2>
            <Link href="/history" className="text-sm font-semibold text-accent">
              {t("viewAll")}
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {recent.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-line bg-white px-4 py-4 shadow-sm"
              >
                <Link href={`/transfers/${item.id}`} className="block">
                  <p className="font-medium">{item.beneficiary.fullName}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {statusLabel(item.status)} · {item.reference}
                  </p>
                  <p className="mt-3 font-display text-lg font-semibold text-accent-strong">
                    {formatMoney(
                      item.receiveAmountXaf,
                      item.receiveCurrency || "XAF",
                    )}
                  </p>
                </Link>
                <Link
                  href={`/transfers/${item.id}/receipt`}
                  className="mt-2 inline-block text-xs font-semibold text-accent"
                >
                  {t("receipt")}
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="how" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("howItWorks")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-muted">
            {t("howItWorksSub")}
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <HowStep n="1" title={t("how1")} text={t("how1Text")} />
            <HowStep n="2" title={t("how2")} text={t("how2Text")} />
            <HowStep n="3" title={t("how3")} text={t("how3Text")} />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-bg py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight">
            {t("whyZendu")}
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Feature title={t("secureTitle")} text={t("secureText")} />
            <Feature title={t("priceTitle")} text={t("priceText")} />
            <Feature title={t("momoTitle")} text={t("momoText")} />
          </div>
        </div>
      </section>

      <section id="countries" className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {t("whereSendQuestion")}
          </h2>
          <p className="mt-2 text-ink-muted">{t("whereSendSub")}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {destinations.map((d) => (
              <Link
                key={d.code}
                href={`/send?corridor=CA-${d.code}`}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-4 transition hover:border-accent hover:bg-accent-soft/50"
              >
                <CountryFlag code={d.code} size={36} title={d.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold group-hover:text-accent-strong">
                    {d.name}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {d.currency} · {t("available")}
                  </p>
                </div>
                <span className="text-accent opacity-0 transition group-hover:opacity-100">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#0c1f18] py-16 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {t("getTheApp")}
            </h2>
            <p className="mt-3 max-w-md text-white/70">{t("getTheAppSub")}</p>
            <div className="mt-8">
              <AppStoreBadges variant="dark" />
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[2rem] border border-white/15 bg-gradient-to-b from-white/15 to-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-5 text-ink">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {appName}
                </p>
                <p className="mt-2 font-display text-2xl font-bold">
                  {t("trackTransfer")}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="h-3 rounded-full bg-bg-soft" />
                  <div className="h-3 w-4/5 rounded-full bg-bg-soft" />
                  <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3">
                    <p className="text-sm font-semibold text-accent-strong">
                      {t("delivery")} · Express
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center font-display text-3xl font-bold tracking-tight">
            {t("faqTitle")}
          </h2>
          <div className="mt-8 space-y-3">
            <FaqItem q={t("faq1q")} a={t("faq1a")} />
            <FaqItem q={t("faq2q")} a={t("faq2a")} />
            <FaqItem q={t("faq3q")} a={t("faq3a")} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-bg py-14">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {t("makeMoves")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            {t("makeMovesSub")}
          </p>
          <Link
            href="/send"
            className="mt-8 inline-flex rounded-full bg-accent px-8 py-3.5 font-semibold text-white hover:bg-accent-strong"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>
    </>
  );
}

function TrustItem({ title }: { title: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-strong">
        ✓
      </span>
      <p className="text-sm font-medium leading-snug text-ink">{title}</p>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}

function HowStep({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="relative text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-bold text-white shadow-md shadow-accent/25">
        {n}
      </span>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-line bg-bg px-5 py-4 open:bg-white open:shadow-sm">
      <summary className="cursor-pointer list-none font-semibold marker:content-none">
        <span className="flex items-center justify-between gap-3">
          {q}
          <span className="text-accent transition group-open:rotate-45">+</span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{a}</p>
    </details>
  );
}

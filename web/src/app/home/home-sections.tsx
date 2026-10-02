"use client";

import Link from "next/link";
import { WstLogo } from "@/components/brand/wst-logo";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

type Action = { href: string; key: HomeKey; icon?: IconName };

const POLES: {
  n: 1 | 2 | 3 | 4;
  href: string;
  icon: IconName;
  accent: string;
  primary: Action;
  more: Action[];
}[] = [
  {
    n: 1,
    href: "/transfert",
    icon: "transfer",
    accent: "from-brand to-sky",
    primary: { href: "#simulateur", key: "actSimulate", icon: "chart" },
    more: [
      { href: "/transfert", key: "actWst" },
      { href: "/frais", key: "actFees" },
    ],
  },
  {
    n: 2,
    href: "/finances",
    icon: "finance",
    accent: "from-navy to-brand",
    primary: { href: "/finances/rendez-vous", key: "actAppointment", icon: "clock" },
    more: [{ href: "/finances", key: "actLearn" }],
  },
  {
    n: 3,
    href: "/technologies",
    icon: "tech",
    accent: "from-brand-strong to-sky",
    primary: { href: "/technologies/projet", key: "actProject", icon: "code" },
    more: [{ href: "/technologies", key: "actLearn" }],
  },
  {
    n: 4,
    href: "/shipping",
    icon: "ship",
    accent: "from-navy to-sky",
    primary: { href: "/shipping/devis", key: "actQuote", icon: "box" },
    more: [
      { href: "/shipping/suivi", key: "actTrack" },
      { href: "/shipping", key: "actLearn" },
    ],
  },
];

/** Les 4 pôles en cartes détaillées, chacune avec ses actions principales. */
export function ServicesSection() {
  const t = useT(homeMessages);
  return (
    <Section id="services" className="scroll-mt-20 bg-bg">
      <Container>
        <SectionHeading
          align="center"
          eyebrow={t("servicesEyebrow")}
          title={t("servicesTitle")}
          subtitle={t("servicesSubtitle")}
        />
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {POLES.map((p) => {
            const k = (suffix: string) => `s${p.n}${suffix}` as HomeKey;
            return (
              <li
                key={p.n}
                className="relative flex flex-col overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-card sm:p-7"
              >
                <div
                  aria-hidden
                  className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${p.accent} opacity-[0.08]`}
                />
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${p.accent} text-white shadow-[0_10px_24px_-10px_rgba(11,77,255,0.8)]`}
                  >
                    <Icon name={p.icon} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-extrabold tracking-tight text-ink">
                      <Link href={p.href} className="rounded hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
                        {t(k("Title"))}
                      </Link>
                    </h3>
                    {p.n === 1 && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 font-display text-xs font-extrabold text-navy">
                        <span aria-hidden className="shrink-0">
                          <WstLogo variant="symbol" className="h-4 w-4" />
                        </span>
                        {t("s1Brand")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t(k("Pitch"))}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink">
                  {(["b1", "b2", "b3"] as const).map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.2} />
                      <span>{t(k(b))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap sm:items-center">
                  {p.primary.href.startsWith("#") ? (
                    <a href={p.primary.href} className={buttonClass("primary", "md")}>
                      {p.primary.icon && <Icon name={p.primary.icon} className="h-4 w-4" />}
                      {t(p.primary.key)}
                    </a>
                  ) : (
                    <ButtonLink href={p.primary.href}>
                      {p.primary.icon && <Icon name={p.primary.icon} className="h-4 w-4" />}
                      {t(p.primary.key)}
                    </ButtonLink>
                  )}
                  {p.more.map((a) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="group inline-flex items-center gap-1.5 self-start rounded px-1 py-1 text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:self-auto"
                    >
                      {t(a.key)}
                      <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}

const STEPS: { n: 1 | 2 | 3 | 4; icon: IconName }[] = [
  { n: 1, icon: "chart" },
  { n: 2, icon: "user" },
  { n: 3, icon: "lock" },
  { n: 4, icon: "clock" },
];

export function StepsSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-bg">
      <Container>
        <SectionHeading eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} subtitle={t("stepsSubtitle")} />
        <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden
            className="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-brand/40 via-sky/40 to-transparent lg:block"
          />
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <div className="flex items-center gap-3">
                <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-brand font-display text-lg font-black text-white ring-8 ring-bg">
                  {s.n}
                </span>
                <Icon name={s.icon} className="h-5 w-5 text-brand" />
              </div>
              <h3 className="mt-5 font-display text-lg font-extrabold tracking-tight text-ink">
                {t(`step${s.n}Title` as HomeKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`step${s.n}Text` as HomeKey)}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

const FEES: { n: 1 | 2 | 3; icon: IconName }[] = [
  { n: 1, icon: "receipt" },
  { n: 2, icon: "chart" },
  { n: 3, icon: "transfer" },
];

/** Frais transparents : la structure (sans chiffres en dur) + lien vers /frais. */
export function FeesSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-white">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <div>
          <SectionHeading eyebrow={t("feesEyebrow")} title={t("feesTitle")} subtitle={t("feesSubtitle")} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/frais">
              <Icon name="receipt" className="h-4 w-4" />
              {t("feesAll")}
            </ButtonLink>
            <a href="#simulateur" className={buttonClass("secondary", "md")}>
              {t("feesSim")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>
          </div>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {FEES.map((f) => (
            <li key={f.n} className="flex gap-4 rounded-3xl border border-line bg-white p-5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand">
                <Icon name={f.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-ink">{t(`fee${f.n}Title` as HomeKey)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{t(`fee${f.n}Text` as HomeKey)}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

const VALUES: { n: 1 | 2 | 3 | 4 | 5; icon: IconName }[] = [
  { n: 1, icon: "receipt" },
  { n: 2, icon: "shield" },
  { n: 3, icon: "globe" },
  { n: 4, icon: "users" },
  { n: 5, icon: "sparkle" },
];

export function ValuesSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-navy-gradient relative overflow-hidden text-white">
      <div aria-hidden className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative">
        <SectionHeading light align="center" eyebrow={t("whyEyebrow")} title={t("whyTitle")} subtitle={t("whySubtitle")} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {VALUES.map((v, i) => (
            <div
              key={v.n}
              className={`rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur transition hover:bg-white/[0.08] lg:col-span-2 ${
                i === 3 ? "lg:col-start-2" : ""
              } ${i === 4 ? "sm:col-span-2 lg:col-span-2" : ""}`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky">
                <Icon name={v.icon} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-extrabold tracking-tight">{t(`v${v.n}Title` as HomeKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{t(`v${v.n}Text` as HomeKey)}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

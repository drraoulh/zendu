"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

const SERVICES: { n: 1 | 2 | 3 | 4; href: string; icon: IconName; accent: string }[] = [
  { n: 1, href: "/transfert", icon: "transfer", accent: "from-brand to-sky" },
  { n: 2, href: "/finances", icon: "finance", accent: "from-navy to-brand" },
  { n: 3, href: "/technologies", icon: "tech", accent: "from-brand-strong to-sky" },
  { n: 4, href: "/shipping", icon: "ship", accent: "from-navy to-sky" },
];

export function ServicesSection() {
  const t = useT(homeMessages);
  return (
    <Section id="services" className="scroll-mt-20 bg-white">
      <Container>
        <SectionHeading
          align="center"
          eyebrow={t("servicesEyebrow")}
          title={t("servicesTitle")}
          subtitle={t("servicesSubtitle")}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const k = (suffix: string) => `s${s.n}${suffix}` as HomeKey;
            return (
              <Link
                key={s.n}
                href={s.href}
                className="group relative flex flex-col rounded-3xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand/30"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-[0_10px_24px_-10px_rgba(11,77,255,0.8)]`}
                >
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-lg font-extrabold tracking-tight text-ink">{t(k("Title"))}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(k("Pitch"))}</p>
                <ul className="mt-5 space-y-2.5 text-sm text-ink">
                  {(["b1", "b2", "b3"] as const).map((b) => (
                    <li key={b} className="flex gap-2.5">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.2} />
                      <span>{t(k(b))}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-brand group-hover:text-brand-strong">
                  {t("discover")}
                  <Icon name="arrowRight" className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
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

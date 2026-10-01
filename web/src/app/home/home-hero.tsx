"use client";

import { TransferCalculator } from "@/components/transfer/transfer-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

export function HomeHero() {
  const t = useT(homeMessages);
  const chips: { icon: IconName; label: string }[] = [
    { icon: "receipt", label: t("chipFees") },
    { icon: "clock", label: t("chipTracking") },
    { icon: "shield", label: t("chipSecure") },
  ];

  return (
    <section className="bg-navy-gradient relative isolate overflow-hidden text-white">
      {/* Décor : grille, halo, orbites */}
      <div
        aria-hidden
        className="bg-grid absolute inset-0 -z-10 opacity-50 [mask-image:radial-gradient(80%_70%_at_50%_30%,black,transparent)]"
      />
      <div
        aria-hidden
        className="absolute -right-32 top-10 -z-10 h-[34rem] w-[34rem] rounded-full bg-brand/30 blur-3xl"
      />
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 -z-10 hidden lg:block">
        <svg width="760" height="760" viewBox="0 0 760 760" fill="none" className="animate-orbit opacity-60">
          <circle cx="380" cy="380" r="370" stroke="url(#ringA)" strokeWidth="1" />
          <circle cx="380" cy="380" r="290" stroke="rgba(201,211,230,0.18)" strokeWidth="1" strokeDasharray="2 10" />
          <circle cx="380" cy="380" r="210" stroke="url(#ringA)" strokeWidth="1" />
          <circle cx="750" cy="380" r="5" fill="#3fa0ff" />
          <circle cx="380" cy="90" r="3.5" fill="#c9d3e6" />
          <circle cx="170" cy="380" r="4" fill="#0b4dff" />
          <defs>
            <linearGradient id="ringA" x1="0" y1="0" x2="760" y2="760" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3fa0ff" stopOpacity="0.6" />
              <stop offset="0.5" stopColor="#c9d3e6" stopOpacity="0.15" />
              <stop offset="1" stopColor="#0b4dff" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <svg
        aria-hidden
        viewBox="0 0 400 400"
        fill="none"
        className="pointer-events-none absolute -left-24 bottom-0 -z-10 h-80 w-80 opacity-40 lg:hidden"
      >
        <circle cx="200" cy="200" r="190" stroke="rgba(63,160,255,0.4)" />
        <circle cx="200" cy="200" r="130" stroke="rgba(201,211,230,0.2)" strokeDasharray="2 8" />
      </svg>

      <Container className="relative grid grid-cols-1 items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:gap-14 lg:pb-24 lg:pt-20">
        <div className="animate-rise min-w-0">
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-sky backdrop-blur sm:text-xs">
            <Icon name="maple" className="h-3.5 w-3.5 shrink-0 text-maple" />
            <span className="min-w-0">{t("heroEyebrow")}</span>
          </p>

          <h1 className="mt-6 font-display text-[2.4rem] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroTitleA")}{" "}
            <span className="bg-gradient-to-r from-sky via-white to-silver bg-clip-text text-transparent">
              {t("heroTitleAccent")}
            </span>{" "}
            {t("heroTitleB")}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{t("heroSubtitle")}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/send" size="lg">
              {t("heroCtaSend")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#services" variant="outline-light" size="lg">
              {t("heroCtaServices")}
            </ButtonLink>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <li
                key={c.icon}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm text-white/85"
              >
                <Icon name={c.icon} className="h-4 w-4 text-sky" />
                {c.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise-2 relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="absolute -inset-4 -z-10 rounded-[2rem] bg-sky/20 blur-2xl" />
          <TransferCalculator />
        </div>
      </Container>
    </section>
  );
}

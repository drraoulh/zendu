"use client";

import Link from "next/link";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { TransferCalculator } from "@/components/transfer/transfer-calculator";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

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

      {/* Hauteur maîtrisée : le simulateur tient au-dessus de la ligne de flottaison à 1366×768. */}
      <Container className="relative grid grid-cols-1 gap-8 pb-12 pt-7 sm:pt-10 lg:grid-cols-[1.08fr_minmax(0,0.92fr)] lg:items-center lg:gap-12 lg:pb-14 lg:pt-6">
        <div className="animate-rise min-w-0">
          <p className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs backdrop-blur sm:rounded-full">
            <span className="inline-flex items-center gap-1.5 font-display font-black tracking-[0.12em] text-white">
              <Icon name="maple" className="h-3.5 w-3.5 shrink-0 text-maple" />
              {t("heroEyebrow")}
            </span>
            <span aria-hidden className="hidden h-3 w-px bg-white/25 sm:block" />
            <span className="min-w-0 font-medium italic text-sky">{t("heroTagline")}</span>
          </p>

          <h1 className="mt-5 font-display text-[2.15rem] font-black leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.15rem] xl:text-[3.4rem]">
            {t("heroTitleA")}{" "}
            <span className="bg-gradient-to-r from-sky via-white to-silver bg-clip-text text-transparent">
              {t("heroTitleAccent")}
            </span>{" "}
            {t("heroTitleB")}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 sm:mt-5 sm:text-lg">{t("heroSubtitle")}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AppDownloadButton size="lg" label={t("heroCtaSend")} />
            <ButtonLink href="#services" variant="outline-light" size="lg">
              {t("heroCtaServices")}
            </ButtonLink>
          </div>

          <ul className="mt-6 hidden flex-wrap gap-2.5 sm:flex">
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
          <TransferCalculator id="simulateur" compact />
        </div>
      </Container>
    </section>
  );
}

const SHORTCUTS: { n: 1 | 2 | 3 | 4 | 5; href: string; icon: IconName }[] = [
  { n: 1, href: "#simulateur", icon: "chart" },
  { n: 2, href: "/shipping/devis", icon: "box" },
  { n: 3, href: "/finances/rendez-vous", icon: "clock" },
  { n: 4, href: "/technologies/projet", icon: "code" },
  { n: 5, href: "/shipping/suivi", icon: "pin" },
];

/** Bande de raccourcis vers les parcours principaux, juste sous le hero. */
export function ShortcutsBand() {
  const t = useT(homeMessages);
  return (
    <nav aria-label={t("shortcutsTitle")} className="border-b border-line bg-white">
      <Container className="py-5 sm:py-6">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {SHORTCUTS.map((s) => {
            const cls =
              "group flex h-full items-center gap-3 rounded-2xl border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:p-3.5";
            const inner = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug text-ink">
                    {t(`sc${s.n}Title` as HomeKey)}
                  </span>
                  <span className="mt-0.5 hidden text-xs text-muted min-[420px]:block">
                    {t(`sc${s.n}Text` as HomeKey)}
                  </span>
                </span>
              </>
            );
            return (
              <li key={s.n} className={s.n === 1 ? "col-span-2 sm:col-span-1" : ""}>
                {s.href.startsWith("#") ? (
                  <a href={s.href} className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link href={s.href} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </nav>
  );
}

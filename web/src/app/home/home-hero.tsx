"use client";

import Image from "next/image";
import Link from "next/link";
import { AppDownloadButton } from "@/components/app/app-download-button";
import { useSite } from "@/components/site-provider";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

/** Les six activités, dans l'ordre fixé par la direction. */
export const ACTIVITIES: { n: 1 | 2 | 3 | 4 | 5 | 6; href: string; image: string }[] = [
  { n: 1, href: "/transfert", image: "/images/transfer.jpg" },
  { n: 2, href: "/avi", image: "/images/avi.jpg" },
  { n: 3, href: "/paiement-fournisseurs", image: "/images/suppliers.jpg" },
  { n: 4, href: "/finances", image: "/images/finances.jpg" },
  { n: 5, href: "/technologies", image: "/images/tech.jpg" },
  { n: 6, href: "/shipping", image: "/images/shipping.jpg" },
];

/** Grande bannière photo arrondie, titre en surimpression (accueil de logitech.com). */
export function HomeHero() {
  const t = useT(homeMessages);

  return (
    <section className="bg-white pt-4 sm:pt-6">
      <Container>
        <div className="relative isolate flex min-h-[34rem] items-end overflow-hidden rounded-3xl bg-navy text-white sm:min-h-[36rem] lg:min-h-[40rem] lg:items-center">
          <Image
            src="/images/hero.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="-z-10 object-cover object-[72%_center]"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/45 to-black/0 lg:bg-gradient-to-r lg:from-black/80 lg:via-black/45 lg:to-black/0" />

          <div className="animate-rise w-full max-w-3xl px-6 pb-10 pt-40 sm:px-12 sm:pb-14 lg:py-20">
            <p className="text-base font-semibold text-white/85 sm:text-lg">{t("heroTagline")}</p>
            <h1 className="mt-3 font-display text-[2.6rem] font-bold leading-[1] min-[375px]:text-5xl sm:text-6xl lg:text-7xl">
              {t("heroTitleA")} {t("heroTitleAccent")}
              {t("heroTitleB")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">{t("heroSubtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <AppDownloadButton variant="white" size="lg" label={t("heroCtaSend")} />
              <ButtonLink href="#services" variant="outline-light" size="lg">
                {t("heroCtaServices")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Rangée de vignettes rondes, une par activité (catégories de logitech.com). */
export function ActivitiesRow() {
  const t = useT(homeMessages);
  const { link } = useSite();
  return (
    <nav aria-label={t("activitiesTitle")} className="bg-white">
      <Container className="py-10 sm:py-14">
        <ul className="-mx-5 flex snap-x gap-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {ACTIVITIES.map((a) => (
            <li key={a.n} className="shrink-0 snap-start">
              <Link
                href={link(a.href)}
                className="group flex w-28 flex-col items-center text-center focus-visible:outline-none sm:w-auto"
              >
                <span className="relative block h-28 w-28 overflow-hidden rounded-full bg-surface-soft ring-offset-4 transition group-focus-visible:ring-2 group-focus-visible:ring-ink sm:h-36 sm:w-36">
                  <Image src={a.image} alt="" fill sizes="144px" className="zoom-on-hover object-cover" />
                </span>
                <span className="mt-4 text-sm font-semibold leading-snug text-ink sm:text-base">{t(`act${a.n}Title` as HomeKey)}</span>
                <span className="mt-0.5 hidden text-xs text-muted sm:block">{t(`act${a.n}Text` as HomeKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}

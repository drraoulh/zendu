"use client";

import Image from "next/image";
import Link from "next/link";
import { WstLogo } from "@/components/brand/wst-logo";
import { useSite } from "@/components/site-provider";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Container, Section, SectionHeading } from "@/components/ui/layout";
import { useT } from "@/i18n/define";
import { homeMessages } from "@/i18n/home";

type HomeKey = keyof typeof homeMessages.fr;

type Action = { href: string; key: HomeKey };

/** `n` renvoie aux textes s{n}… ; l'ordre du tableau est l'ordre d'affichage. */
const POLES: { n: 1 | 2 | 3 | 4 | 5 | 6; href: string; image: string; primary: Action; more: Action }[] = [
  { n: 1, href: "/transfert", image: "/images/transfer.jpg", primary: { href: "/transfert#simulateur", key: "actSimulate" }, more: { href: "/transfert", key: "actWst" } },
  { n: 5, href: "/avi", image: "/images/avi.jpg", primary: { href: "/contact?sujet=avi", key: "actAviRequest" }, more: { href: "/avi", key: "actLearn" } },
  {
    n: 6,
    href: "/paiement-fournisseurs",
    image: "/images/suppliers.jpg",
    primary: { href: "/contact?sujet=fournisseurs", key: "actSupplierRequest" },
    more: { href: "/paiement-fournisseurs", key: "actLearn" },
  },
  { n: 2, href: "/finances", image: "/images/finances.jpg", primary: { href: "/finances/rendez-vous", key: "actAppointment" }, more: { href: "/finances", key: "actLearn" } },
  { n: 3, href: "/technologies", image: "/images/tech.jpg", primary: { href: "/technologies/projet", key: "actProject" }, more: { href: "/technologies", key: "actLearn" } },
  { n: 4, href: "/shipping", image: "/images/shipping.jpg", primary: { href: "/shipping/devis", key: "actQuote" }, more: { href: "/shipping", key: "actLearn" } },
];

/** Les six activités en tuiles photo (« Acheter par centre d'intérêt » de logitech.com). */
export function ServicesSection() {
  const t = useT(homeMessages);
  const { link } = useSite();
  return (
    <Section id="services" className="scroll-mt-20 bg-white pt-6 sm:pt-10">
      <Container>
        <SectionHeading eyebrow={t("servicesEyebrow")} title={t("servicesTitle")} subtitle={t("servicesSubtitle")} />
        <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {POLES.map((p) => {
            const k = (suffix: string) => `s${p.n}${suffix}` as HomeKey;
            return (
              <li key={p.n} className="group flex flex-col">
                <Link
                  href={link(p.href)}
                  className="relative block aspect-[4/3] overflow-hidden rounded-3xl bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4"
                  aria-label={t(k("Title"))}
                >
                  <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="zoom-on-hover object-cover" />
                  {p.n === 1 && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink">
                      <WstLogo variant="symbol" className="h-4 w-4" />
                      {t("s1Brand")}
                    </span>
                  )}
                </Link>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink sm:text-[1.75rem]">
                  <Link href={link(p.href)} className="hover:underline hover:decoration-2 hover:underline-offset-4">
                    {t(k("Title"))}
                  </Link>
                </h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-muted">{t(k("Pitch"))}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <ButtonLink href={link(p.primary.href)}>{t(p.primary.key)}</ButtonLink>
                  <Link href={link(p.more.href)} className="inline-flex items-center gap-1.5 text-sm font-bold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                    {t(p.more.key)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
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

/** Engagements en colonnes simples sur fond gris (« Raisons d'acheter » de logitech.com). */
export function ValuesSection() {
  const t = useT(homeMessages);
  return (
    <Section className="bg-bg">
      <Container>
        <SectionHeading eyebrow={t("whyEyebrow")} title={t("whyTitle")} subtitle={t("whySubtitle")} />
        <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map((v) => (
            <li key={v.n}>
              <Icon name={v.icon} className="h-8 w-8 text-ink" strokeWidth={1.6} />
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{t(`v${v.n}Title` as HomeKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`v${v.n}Text` as HomeKey)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

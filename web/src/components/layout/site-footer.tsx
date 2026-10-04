"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LogoWordmark } from "@/components/brand/logo";
import { LanguageSelect } from "@/components/layout/language-select";
import { Container } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { WstLogo } from "@/components/brand/wst-logo";
import { StoreBadges } from "@/components/app/store-badges";
import { CompanyValue } from "@/components/info/shared";
import { appMessages } from "@/i18n/app";
import { appFullName, appName } from "@/lib/brand";
import { company, companyLocality, socialLinks, telHref, whatsappHref } from "@/lib/company";
import { common } from "@/i18n/common";
import { footerMessages } from "@/i18n/info";
import { useT } from "@/i18n/define";

type FooterKey = keyof typeof footerMessages.fr;

const COLUMNS: Array<{ title: FooterKey; links: Array<{ href: string; key: FooterKey }> }> = [
  {
    title: "services",
    links: [
      { href: "/transfert", key: "transfer" },
      { href: "/application", key: "wst" },
      { href: "/finances", key: "finances" },
      { href: "/technologies", key: "tech" },
      { href: "/shipping", key: "shipping" },
    ],
  },
  {
    title: "info",
    links: [
      { href: "/frais", key: "fees" },
      { href: "/pays", key: "countries" },
      { href: "/aide", key: "help" },
      { href: "/shipping/suivi", key: "tracking" },
    ],
  },
  {
    title: "company",
    links: [
      { href: "/a-propos", key: "about" },
      { href: "/contact", key: "contact" },
      { href: "/application", key: "download" },
    ],
  },
  {
    title: "legal",
    links: [
      { href: "/confidentialite", key: "privacy" },
      { href: "/conditions", key: "terms" },
      { href: "/conditions#section-5", key: "feesTerms" },
    ],
  },
];

export function SiteFooter() {
  const t = useT(common);
  const f = useT(footerMessages);
  const ta = useT(appMessages);
  const year = new Date().getFullYear();
  const locality = companyLocality();
  const wa = whatsappHref(company.whatsapp);
  const socials = socialLinks();

  return (
    <footer className="bg-navy-gradient text-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2.65fr]">
          <div>
            <LogoWordmark light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{t("tagline")}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/85">
              <Icon name="maple" className="h-4 w-4 text-maple" />
              {t("basedIn")}
            </p>

            <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{f("contactTitle")}</p>
            <ul className="mt-4 grid gap-3 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-sky" />
                <CompanyValue
                  value={company.email}
                  href={company.email ? `mailto:${company.email}` : null}
                  light
                  className="break-all hover:text-white"
                />
              </li>
              <li className="flex items-center gap-2.5">
                <Icon name="phone" className="h-4 w-4 shrink-0 text-sky" />
                <CompanyValue value={company.phone} href={company.phone ? telHref(company.phone) : null} light className="hover:text-white" />
              </li>
              {wa && (
                <li className="flex items-center gap-2.5">
                  <Icon name="phone" className="h-4 w-4 shrink-0 text-sky" />
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    WhatsApp
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
                <span>
                  {company.address && <span className="block">{company.address}</span>}
                  <span className="block">{[locality, company.country].filter(Boolean).join(", ")}</span>
                </span>
              </li>
              {company.hours && (
                <li className="flex items-center gap-2.5">
                  <Icon name="clock" className="h-4 w-4 shrink-0 text-sky" />
                  {company.hours}
                </li>
              )}
            </ul>

            {socials.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{f("follow")}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s) => (
                    <li key={s.id}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/15 hover:text-white"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <LanguageSelect dark />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <FooterColumn key={col.title} title={f(col.title)}>
                {col.links.map((l) => (
                  <FooterLink key={`${l.href}-${l.key}`} href={l.href}>
                    {f(l.key)}
                  </FooterLink>
                ))}
              </FooterColumn>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-sky">{ta("ourApp")}</p>
            <Link href="/application" className="mt-3 inline-block" aria-label="WorldSoft Transfer">
              <WstLogo variant="negative" className="h-7 w-auto" />
            </Link>
            <p className="mt-3 max-w-md text-sm text-white/70">{ta("ourAppText")}</p>
          </div>
          <StoreBadges dark />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {appName} — {company.legalName ?? appFullName}. {t("rights")}
            {company.registration && <span className="block sm:inline"> {f("registration", { n: company.registration })}</span>}
          </p>
          <div className="-my-2 flex flex-wrap gap-x-5 sm:my-0">
            <Link href="/confidentialite" className="py-2 hover:text-white sm:py-0">
              {f("privacy")}
            </Link>
            <Link href="/conditions" className="py-2 hover:text-white sm:py-0">
              {f("terms")}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="break-words font-display text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-sm sm:tracking-[0.14em]">{title}</p>
      <div className="mt-4 flex flex-col items-start gap-1 sm:mt-5">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="py-1 text-sm text-white/70 transition hover:text-white">
      {children}
    </Link>
  );
}

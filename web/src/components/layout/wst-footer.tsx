"use client";

import Link from "next/link";
import { WstLogo } from "@/components/brand/wst-logo";
import { StoreBadges } from "@/components/app/store-badges";
import { CompanyValue } from "@/components/info/shared";
import { LanguageSelect } from "@/components/layout/language-select";
import { useSite } from "@/components/site-provider";
import { Container } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { appFullName } from "@/lib/brand";
import { company, telHref, whatsappHref } from "@/lib/company";
import { appMessages } from "@/i18n/app";
import { common } from "@/i18n/common";
import { footerMessages } from "@/i18n/info";
import { useT } from "@/i18n/define";

type CommonKey = keyof typeof common.fr;
type FooterKey = keyof typeof footerMessages.fr;
type FooterLinkDef = { href: string } & ({ c: CommonKey } | { f: FooterKey });

const COLUMNS: Array<{ title: FooterKey; links: FooterLinkDef[] }> = [
  {
    title: "wst",
    links: [
      { href: "/#simulateur", c: "sendMoney" },
      { href: "/frais", f: "fees" },
      { href: "/pays", f: "countries" },
      { href: "/application", f: "download" },
    ],
  },
  {
    title: "info",
    links: [
      { href: "/aide", f: "help" },
      { href: "/contact", f: "contact" },
    ],
  },
  {
    title: "legal",
    links: [
      { href: "/confidentialite", f: "privacy" },
      { href: "/conditions", f: "terms" },
      { href: "/conditions#section-5", f: "feesTerms" },
    ],
  },
];

/** Pied de page du site WorldSoft Transfer. */
export function WstFooter() {
  const t = useT(common);
  const f = useT(footerMessages);
  const ta = useT(appMessages);
  const { siteHref } = useSite();
  const year = new Date().getFullYear();
  const wa = whatsappHref(company.whatsapp);
  const label = (l: FooterLinkDef) => ("c" in l ? t(l.c) : f(l.f));

  return (
    <footer className="bg-navy-gradient text-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2.65fr]">
          <div>
            <Link href="/" aria-label="WorldSoft Transfer" className="inline-block">
              <WstLogo variant="negative" className="h-8 w-auto" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{t("wstAbout")}</p>
            <a
              href={siteHref("pwfintech", "/")}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky hover:text-white"
            >
              {t("wstBy")}
              <Icon name="arrowRight" className="h-4 w-4" />
            </a>

            <p className="mt-8 font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{f("contactTitle")}</p>
            <ul className="mt-4 grid gap-3 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <Icon name="mail" className="h-4 w-4 shrink-0 text-sky" />
                <CompanyValue value={company.email} href={company.email ? `mailto:${company.email}` : null} light className="break-all hover:text-white" />
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
            </ul>

            <div className="mt-6">
              <LanguageSelect dark />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <p className="font-display text-xs font-bold uppercase tracking-[0.14em] text-white sm:text-sm">{f(col.title)}</p>
                <div className="mt-4 flex flex-col items-start gap-1 sm:mt-5">
                  {col.links.map((l) => (
                    <Link key={l.href} href={l.href} className="py-1 text-sm text-white/70 transition hover:text-white">
                      {label(l)}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-sky">{ta("ourApp")}</p>
            <p className="mt-3 max-w-md text-sm text-white/70">{ta("ourAppText")}</p>
          </div>
          <StoreBadges dark />
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} WorldSoft Transfer · {t("wstBy")} ({company.legalName ?? appFullName}). {t("rights")}
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

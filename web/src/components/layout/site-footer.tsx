"use client";

import Link from "next/link";
import { LogoWordmark } from "@/components/brand/logo";
import { LanguageSelect } from "@/components/layout/language-select";
import { Container } from "@/components/ui/layout";
import { Icon } from "@/components/ui/icon";
import { NAV } from "@/components/layout/site-header";
import { WstLogo } from "@/components/brand/wst-logo";
import { StoreBadges } from "@/components/app/store-badges";
import { appMessages } from "@/i18n/app";
import { appFullName, appName, contact } from "@/lib/brand";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";

export function SiteFooter() {
  const t = useT(common);
  const ta = useT(appMessages);
  const year = new Date().getFullYear();

  const services = NAV.slice(0, 4);
  const company = NAV.slice(4);

  return (
    <footer className="bg-navy-gradient text-white">
      <Container className="py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <LogoWordmark light />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">{t("tagline")}</p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/85">
              <Icon name="maple" className="h-4 w-4 text-maple" />
              {t("basedIn")}
            </p>
          </div>

          <FooterColumn title={t("services")}>
            {services.map((s) => (
              <FooterLink key={s.href} href={s.href}>
                {t(s.key)}
              </FooterLink>
            ))}
            <FooterLink href="/transfert">WorldSoft Transfer</FooterLink>
            <FooterLink href="/application">{ta("downloadApp")}</FooterLink>
          </FooterColumn>

          <FooterColumn title={t("company")}>
            {company.map((s) => (
              <FooterLink key={s.href} href={s.href}>
                {t(s.key)}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={t("contactUs")}>
            <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white">
              <Icon name="mail" className="h-4 w-4 text-sky" />
              {contact.email}
            </a>
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 text-sm text-white/70 hover:text-white">
                <Icon name="phone" className="h-4 w-4 text-sky" />
                {contact.phone}
              </a>
            )}
            <span className="inline-flex items-center gap-2.5 text-sm text-white/70">
              <Icon name="pin" className="h-4 w-4 text-sky" />
              {contact.city}, {contact.country}
            </span>
            <div className="pt-2">
              <LanguageSelect dark />
            </div>
          </FooterColumn>
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
            © {year} {appName} — {appFullName}. {t("rights")}
          </p>
          <div className="flex gap-5">
            <Link href="/confidentialite" className="hover:text-white">
              {t("privacy")}
            </Link>
            <Link href="/conditions" className="hover:text-white">
              {t("terms")}
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">{title}</p>
      <div className="mt-5 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-white/70 transition hover:text-white">
      {children}
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WstLogo } from "@/components/brand/wst-logo";
import { displayName, useAuth } from "@/components/auth-provider";
import { StoreBadges } from "@/components/app/store-badges";
import { LanguageSelect } from "@/components/layout/language-select";
import { useSite } from "@/components/site-provider";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { webTransfersEnabled } from "@/lib/app-links";
import { appMessages } from "@/i18n/app";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";

type CommonKey = keyof typeof common.fr;

const LINKS: { href: string; key: CommonKey; icon: IconName }[] = [
  { href: "/#simulateur", key: "sendMoney", icon: "transfer" },
  { href: "/frais", key: "navFees", icon: "receipt" },
  { href: "/pays", key: "navCountries", icon: "globe" },
  { href: "/aide", key: "navHelp", icon: "info" },
  { href: "/contact", key: "navContact", icon: "mail" },
];

/** En-tête du site WorldSoft Transfer. */
export function WstHeader() {
  const t = useT(common);
  const ta = useT(appMessages);
  const pathname = usePathname();
  const { siteHref } = useSite();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => {
    const h = href.split("#")[0];
    if (h === "/") return false;
    return pathname === h || pathname.startsWith(`${h}/`);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition ${
        scrolled ? "border-line shadow-[0_6px_20px_-12px_rgba(10,24,56,0.25)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-5 sm:px-6">
        <Link href="/" aria-label="WorldSoft Transfer" className="shrink-0">
          <WstLogo priority className="h-7 w-auto sm:h-8" />
        </Link>

        <nav aria-label={t("mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    isActive(l.href) ? "bg-brand-soft text-brand-strong" : "text-ink/75 hover:bg-surface-soft hover:text-ink"
                  }`}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSelect />
          </div>
          {webTransfersEnabled && !loading && user ? (
            <div className="hidden items-center gap-1 xl:flex">
              <Link href="/history" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-surface-soft">
                <Icon name="user" className="h-4 w-4" />
                <span className="max-w-[8rem] truncate">{displayName(user)}</span>
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full p-2 text-muted hover:bg-surface-soft hover:text-ink"
                aria-label={t("logOut")}
                title={t("logOut")}
              >
                <Icon name="logout" className="h-4 w-4" />
              </button>
            </div>
          ) : webTransfersEnabled ? (
            <Link href="/login" className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-soft xl:inline-flex">
              {t("logIn")}
            </Link>
          ) : null}
          <div className="hidden sm:block">
            <ButtonLink href="/application" size="sm" className="whitespace-nowrap">
              <Image src="/brand/wst/symbol-mono-white.svg" width={20} height={20} alt="" className="h-4 w-4" unoptimized />
              {ta("downloadApp")}
            </ButtonLink>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink lg:hidden"
            aria-label={open ? t("close") : t("menu")}
            aria-expanded={open}
            aria-controls="wst-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="wst-mobile-menu"
          className="absolute inset-x-0 top-full h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-line bg-white lg:hidden"
        >
          <nav
            aria-label={t("mainNav")}
            className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold ${
                  isActive(l.href) ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-surface-soft"
                }`}
              >
                <Icon name={l.icon} className="h-5 w-5 text-brand" />
                {t(l.key)}
              </Link>
            ))}

            <div className="my-3 border-t border-line" />

            {webTransfersEnabled &&
              (!loading && user ? (
                <>
                  <Link href="/history" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold hover:bg-surface-soft">
                    <Icon name="receipt" /> {t("navHistory")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-muted hover:bg-surface-soft"
                  >
                    <Icon name="logout" /> {t("logOut")} · {displayName(user)}
                  </button>
                </>
              ) : (
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <Link href="/login" className={buttonClass("secondary", "lg")}>
                    {t("logIn")}
                  </Link>
                  <Link href="/signup" className={buttonClass("primary", "lg")}>
                    {t("signUp")}
                  </Link>
                </div>
              ))}

            <ButtonLink href="/application" size="lg" className="w-full">
              {ta("downloadApp")}
            </ButtonLink>

            <div className="mt-5 rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold text-ink">{ta("ourApp")}</p>
              <p className="mt-1 text-sm text-muted">{ta("ourAppText")}</p>
              <StoreBadges className="mt-4" />
            </div>

            <a
              href={siteHref("pwfintech", "/")}
              className="mt-5 flex items-center justify-between rounded-2xl bg-surface-soft px-4 py-3 text-sm font-semibold text-ink hover:bg-brand-soft"
            >
              {t("wstBy")}
              <Icon name="arrowRight" className="h-4 w-4 text-brand" />
            </a>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-soft px-4 py-3">
              <span className="text-sm font-semibold text-muted">{t("language")}</span>
              <LanguageSelect />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

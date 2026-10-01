"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoWordmark } from "@/components/brand/logo";
import { LanguageSelect } from "@/components/layout/language-select";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { displayName, useAuth } from "@/components/auth-provider";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";

type NavKey = "navTransfer" | "navFinances" | "navTech" | "navShipping" | "navAbout" | "navContact";

export const NAV: { href: string; key: NavKey; icon: IconName }[] = [
  { href: "/transfert", key: "navTransfer", icon: "transfer" },
  { href: "/finances", key: "navFinances", icon: "finance" },
  { href: "/technologies", key: "navTech", icon: "tech" },
  { href: "/shipping", key: "navShipping", icon: "ship" },
  { href: "/a-propos", key: "navAbout", icon: "info" },
  { href: "/contact", key: "navContact", icon: "mail" },
];

export function SiteHeader() {
  const t = useT(common);
  const pathname = usePathname();
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
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition ${
        scrolled ? "border-line shadow-[0_6px_20px_-12px_rgba(10,24,56,0.25)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-5 sm:px-6">
        <Link href="/" aria-label="PWFINTECH" className="shrink-0">
          <LogoWordmark priority />
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                isActive(item.href) ? "bg-brand-soft text-brand-strong" : "text-ink/75 hover:bg-surface-soft hover:text-ink"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSelect />
          </div>
          {!loading && user ? (
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-surface-soft"
              >
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
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-soft lg:inline-flex"
            >
              {t("logIn")}
            </Link>
          )}
          <ButtonLink href="/send" size="sm" className="hidden sm:inline-flex">
            {t("sendMoney")}
            <Icon name="arrowRight" className="h-4 w-4" />
          </ButtonLink>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink xl:hidden"
            aria-label={open ? t("close") : t("menu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto border-t border-line bg-white xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold ${
                  isActive(item.href) ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-surface-soft"
                }`}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                {t(item.key)}
              </Link>
            ))}

            <div className="my-3 border-t border-line" />

            {!loading && user ? (
              <>
                <Link href="/history" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold hover:bg-surface-soft">
                  <Icon name="receipt" /> {t("navHistory")}
                </Link>
                <Link href="/refer" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold hover:bg-surface-soft">
                  <Icon name="gift" /> {t("navRefer")}
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
              <div className="grid grid-cols-2 gap-3">
                <Link href="/login" className={buttonClass("secondary", "lg")}>
                  {t("logIn")}
                </Link>
                <Link href="/signup" className={buttonClass("primary", "lg")}>
                  {t("signUp")}
                </Link>
              </div>
            )}

            <ButtonLink href="/send" size="lg" className="mt-3 w-full">
              {t("sendMoney")}
            </ButtonLink>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-surface-soft px-4 py-3">
              <span className="text-sm font-semibold text-muted">{t("language")}</span>
              <LanguageSelect />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

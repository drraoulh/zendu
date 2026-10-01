"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { displayName, useAuth } from "@/components/auth-provider";

import { appFullName, appName } from "@/lib/brand";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/send", label: t("sendMoney") },
    { href: "/history", label: t("transferHistory") },
    { href: "/refer", label: t("referFriends") },
    { href: "/#faq", label: t("help") },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function navClass(href: string) {
    const active =
      href === "/send"
        ? pathname.startsWith("/send")
        : href === "/history"
          ? pathname.startsWith("/history") || pathname.startsWith("/transfers")
          : pathname === href;
    return `rounded-lg px-3 py-2 font-medium transition ${
      active
        ? "bg-accent-soft text-accent-strong"
        : "text-ink-muted hover:bg-bg-soft hover:text-ink"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-[0_1px_0_rgba(11,22,48,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5" title={appFullName}>
            <BrandMark />
            <span className="font-display text-[1.35rem] font-bold tracking-tight text-ink">
              {appName}
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 text-sm lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={navClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          {!loading && user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="max-w-[8rem] truncate text-sm text-ink-muted">
                {displayName(user)}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-bg-soft"
              >
                {t("logOut")}
              </button>
              <Link
                href="/send"
                className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                {t("sendMoneyCta")}
              </Link>
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-bg-soft"
              >
                {t("logIn")}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong"
              >
                {t("signUp")}
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line lg:hidden"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <span className="text-lg leading-none">×</span>
            ) : (
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
                <span className="block h-0.5 w-4 bg-ink" />
              </span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${navClass(l.href)} block`}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 border-t border-line pt-3">
              <LanguageSwitcher />
            </div>
            {!loading && user ? (
              <>
                <p className="px-3 text-sm text-ink-muted">
                  {displayName(user)}
                </p>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-lg px-3 py-2 text-left font-semibold"
                >
                  {t("logOut")}
                </button>
              </>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link
                  href="/login"
                  className="flex-1 rounded-full border border-line py-2.5 text-center text-sm font-semibold"
                >
                  {t("logIn")}
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 rounded-full bg-accent py-2.5 text-center text-sm font-semibold text-white"
                >
                  {t("signUp")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

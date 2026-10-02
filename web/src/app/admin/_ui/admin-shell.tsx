"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useAdminT } from "./kit";

const NAV: { href: string; key: "navOverview" | "navRequests" | "navShipments" | "navTransfers"; icon: IconName }[] = [
  { href: "/admin", key: "navOverview", icon: "chart" },
  { href: "/admin/demandes", key: "navRequests", icon: "mail" },
  { href: "/admin/colis", key: "navShipments", icon: "box" },
  { href: "/admin/transferts", key: "navTransfers", icon: "transfer" },
];

/** Cadre de l'espace équipe : bandeau, navigation latérale (onglets sur mobile), déconnexion. */
export function AdminShell({ devOpen, children }: { devOpen: boolean; children: ReactNode }) {
  const { t } = useAdminT();
  const pathname = usePathname() ?? "/admin";
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="bg-bg pb-16">
      {devOpen && (
        <div role="status" className="border-b border-warn/25 bg-[#fff7e6] px-4 py-2 text-center text-xs font-semibold text-[#7a5308] sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <Icon name="lock" className="h-4 w-4 shrink-0" />
            {t("devOpenBanner")}
          </span>
        </div>
      )}

      <section className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative flex flex-wrap items-center justify-between gap-4 py-7 sm:py-9">
          <div className="min-w-0">
            <Eyebrow light>{t("shellEyebrow")}</Eyebrow>
            <p className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{t("shellTitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Icon name="globe" className="h-4 w-4" />
              {t("viewSite")}
            </Link>
            {!devOpen && (
              <form action="/admin/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-brand-soft"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  {t("logout")}
                </button>
              </form>
            )}
          </div>
        </Container>
      </section>

      <Container className="mt-6 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
        <nav aria-label={t("navLabel")} className="lg:sticky lg:top-24 lg:self-start">
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active
                        ? "bg-brand text-white shadow-[0_8px_20px_-10px_rgba(11,77,255,0.8)]"
                        : "border border-line bg-white text-ink hover:border-brand/40 hover:text-brand-strong"
                    }`}
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-6 min-w-0 lg:mt-0">{children}</div>
      </Container>
    </div>
  );
}

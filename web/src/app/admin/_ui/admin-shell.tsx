"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useT } from "@/i18n/define";
import { customersMessages } from "@/i18n/admin-customers";
import type { ActionCounts } from "../_server/insights";
import { useAdminT } from "./kit";

type NavKey = "navOverview" | "navRequests" | "navShipments" | "navTransfers" | "navCustomers" | "navSecurity";

const NAV: { href: string; key: NavKey; icon: IconName; pending?: (c: ActionCounts) => number }[] = [
  { href: "/admin", key: "navOverview", icon: "chart" },
  // Outil quotidien (virements à vérifier, versements à faire) : en tête, visible sans défiler sur mobile.
  { href: "/admin/transferts", key: "navTransfers", icon: "transfer", pending: (c) => (c.interac ?? 0) + (c.payouts ?? 0) + (c.issues ?? 0) },
  { href: "/admin/clients", key: "navCustomers", icon: "users", pending: (c) => c.kycPending ?? 0 },
  { href: "/admin/demandes", key: "navRequests", icon: "mail", pending: (c) => c.newRequests ?? 0 },
  { href: "/admin/colis", key: "navShipments", icon: "box" },
  { href: "/admin/securite", key: "navSecurity", icon: "shield" },
];

/** Cadre de l'espace équipe : bandeau, navigation latérale (onglets sur mobile) avec dossiers en attente, déconnexion. */
export function AdminShell({ devOpen, counts, children }: { devOpen: boolean; counts: ActionCounts | null; children: ReactNode }) {
  const { t: tAdmin } = useAdminT();
  const tc = useT(customersMessages);
  const t = (key: NavKey | Parameters<typeof tAdmin>[0]) =>
    key === "navCustomers" ? tc("navCustomers") : tAdmin(key as Parameters<typeof tAdmin>[0]);
  const pathname = usePathname() ?? "/admin";
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-bg pb-16">
      {devOpen && (
        <div role="status" className="border-b border-warn/25 bg-[#fff7e6] px-4 py-2 text-center text-xs font-semibold text-[#7a5308] sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <Icon name="lock" className="h-4 w-4 shrink-0" />
            {t("devOpenBanner")}
          </span>
        </div>
      )}

      <header className="bg-navy-gradient relative overflow-hidden text-white">
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <Container className="relative flex flex-wrap items-center justify-between gap-3 py-4 sm:py-5">
          <Link href="/admin" className="flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <Eyebrow light>{t("shellEyebrow")}</Eyebrow>
              <span className="mt-0.5 block font-display text-xl font-extrabold tracking-tight sm:text-2xl">{t("shellTitle")}</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <Icon name="globe" className="h-4 w-4" />
              {t("viewSite")}
            </Link>
            {!devOpen && (
              <form action="/admin/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-brand-soft"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  {t("logout")}
                </button>
              </form>
            )}
          </div>
        </Container>
      </header>

      <Container className="mt-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <nav aria-label={t("navLabel")} className="lg:sticky lg:top-6 lg:self-start">
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:rounded-3xl lg:border lg:border-line lg:bg-white lg:p-2 lg:shadow-card">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const pending = counts && item.pending ? item.pending(counts) : 0;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
                      active
                        ? "bg-brand text-white shadow-[0_8px_20px_-10px_rgba(11,77,255,0.8)]"
                        : "border border-line bg-white text-ink hover:border-brand/40 hover:text-brand-strong lg:border-transparent lg:hover:bg-surface-soft"
                    }`}
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{t(item.key)}</span>
                    {pending > 0 && (
                      <span
                        className={`inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none ${
                          active ? "bg-white text-brand" : "bg-warn text-white"
                        }`}
                      >
                        {pending > 99 ? "99+" : pending}
                      </span>
                    )}
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

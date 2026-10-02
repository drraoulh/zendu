"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LogoWordmark } from "@/components/brand/logo";
import { LanguageSelect } from "@/components/layout/language-select";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { displayName, useAuth } from "@/components/auth-provider";
import { StoreBadges } from "@/components/app/store-badges";
import { webTransfersEnabled } from "@/lib/app-links";
import { appMessages } from "@/i18n/app";
import { common } from "@/i18n/common";
import { useT } from "@/i18n/define";

type CommonKey = keyof typeof common.fr;
type NavKey = "navTransfer" | "navFinances" | "navTech" | "navShipping" | "navAbout" | "navContact";

/**
 * Liste plate historique (utilisée par le pied de page : 4 pôles puis À propos / Contact).
 * Forme conservée : { href, key, icon }.
 */
export const NAV: { href: string; key: NavKey; icon: IconName }[] = [
  { href: "/transfert", key: "navTransfer", icon: "transfer" },
  { href: "/finances", key: "navFinances", icon: "finance" },
  { href: "/technologies", key: "navTech", icon: "tech" },
  { href: "/shipping", key: "navShipping", icon: "ship" },
  { href: "/a-propos", key: "navAbout", icon: "info" },
  { href: "/contact", key: "navContact", icon: "mail" },
];

export type MenuLink = { href: string; key: CommonKey };
export type MenuItem = { href: string; key: CommonKey; desc: CommonKey; icon: IconName; actions: MenuLink[] };

/** Menu « Services » : un pôle par entrée, avec ses actions principales. */
export const SERVICES_MENU: MenuItem[] = [
  {
    href: "/transfert",
    key: "navTransfer",
    desc: "descTransfer",
    icon: "transfer",
    actions: [
      { href: "/transfert#simulateur", key: "actSimulate" },
      { href: "/frais", key: "navFees" },
    ],
  },
  {
    href: "/finances",
    key: "navFinances",
    desc: "descFinances",
    icon: "finance",
    actions: [{ href: "/finances/rendez-vous", key: "actAppointment" }],
  },
  {
    href: "/technologies",
    key: "navTech",
    desc: "descTech",
    icon: "tech",
    actions: [{ href: "/technologies/projet", key: "actProject" }],
  },
  {
    href: "/shipping",
    key: "navShipping",
    desc: "descShipping",
    icon: "ship",
    actions: [
      { href: "/shipping/devis", key: "actQuote" },
      { href: "/shipping/suivi", key: "actTrack" },
    ],
  },
];

/** Menu « Informations ». */
export const INFO_MENU: MenuItem[] = [
  { href: "/frais", key: "navFees", desc: "descFees", icon: "receipt", actions: [] },
  { href: "/pays", key: "navCountries", desc: "descCountries", icon: "globe", actions: [] },
  { href: "/aide", key: "navHelp", desc: "descHelp", icon: "info", actions: [] },
];

/** Liens directs (hors menus déroulants). */
export const DIRECT_LINKS: MenuLink[] = [
  { href: "/a-propos", key: "navAbout" },
  { href: "/contact", key: "navContact" },
];

type MenuId = "services" | "info";

/** Petit symbole WST blanc pour le bouton « Télécharger l'app ». */
function WstGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return <Image src="/brand/wst/symbol-mono-white.svg" width={20} height={20} alt="" className={className} unoptimized />;
}

function stripHash(href: string) {
  return href.split("#")[0];
}

export function SiteHeader() {
  const t = useT(common);
  const ta = useT(appMessages);
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<MenuId | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Fermer menus et panneau mobile à chaque changement de page.
  useEffect(() => {
    setOpen(false);
    setMenu(null);
  }, [pathname]);

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

  // Clic extérieur : fermer le menu déroulant.
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menu]);

  // Échap : fermer le panneau mobile.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => {
    const h = stripHash(href);
    return pathname === h || pathname.startsWith(`${h}/`);
  };
  const groupActive = (items: MenuItem[]) =>
    items.some((i) => isActive(i.href) || i.actions.some((a) => isActive(a.href)));

  const closeMenu = useCallback(() => setMenu(null), []);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition ${
        scrolled || menu ? "border-line shadow-[0_6px_20px_-12px_rgba(10,24,56,0.25)]" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-3 px-5 sm:px-6">
        <Link href="/" aria-label="PWFINTECH" className="shrink-0">
          <LogoWordmark priority compact />
        </Link>

        {/* Navigation ordinateur */}
        <nav ref={navRef} aria-label={t("mainNav")} className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            <li>
              <Dropdown
                id="services"
                label={t("services")}
                active={groupActive(SERVICES_MENU)}
                open={menu === "services"}
                onToggle={(v) => setMenu(v ? "services" : null)}
                onClose={closeMenu}
                panelClassName="w-[min(44rem,calc(100vw-2rem))] -left-24 xl:left-0"
              >
                <ul className="grid gap-1 p-3 sm:grid-cols-2">
                  {SERVICES_MENU.map((item) => (
                    <li key={item.href}>
                      <ServicePanelItem item={item} t={t} active={isActive(item.href)} onNavigate={closeMenu} />
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-soft/70 px-5 py-3.5">
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Icon name="phone" className="h-4 w-4 text-brand" />
                    {ta("ourAppText")}
                  </p>
                  <Link
                    href="/application"
                    onClick={closeMenu}
                    className="inline-flex items-center gap-1 rounded text-sm font-semibold text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {ta("downloadApp")}
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </Link>
                </div>
              </Dropdown>
            </li>
            <li>
              <Dropdown
                id="info"
                label={t("navInfo")}
                active={groupActive(INFO_MENU)}
                open={menu === "info"}
                onToggle={(v) => setMenu(v ? "info" : null)}
                onClose={closeMenu}
                panelClassName="w-80 left-0"
              >
                <ul className="grid gap-1 p-3">
                  {INFO_MENU.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMenu}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className="group flex gap-3 rounded-2xl p-3 transition hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                          <Icon name={item.icon} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-ink group-hover:text-brand">{t(item.key)}</span>
                          <span className="mt-0.5 block text-xs leading-snug text-muted">{t(item.desc)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Dropdown>
            </li>
            {DIRECT_LINKS.map((l) => (
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
          ) : webTransfersEnabled ? (
            <Link
              href="/login"
              className="hidden whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-surface-soft xl:inline-flex"
            >
              {t("logIn")}
            </Link>
          ) : null}
          <div className="hidden sm:block">
            <ButtonLink href="/application" size="sm" className="whitespace-nowrap">
              <WstGlyph />
              {ta("downloadApp")}
            </ButtonLink>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-ink lg:hidden"
            aria-label={open ? t("close") : t("menu")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-[4.5rem] overflow-y-auto overscroll-contain border-t border-line bg-white lg:hidden"
        >
          <nav
            aria-label={t("mainNav")}
            className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5"
            onClick={(e) => {
              // Ferme le panneau aussi pour les liens d'ancre vers la page courante.
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            <Accordion title={t("services")} icon="sparkle" defaultOpen>
              <ul className="space-y-1">
                {SERVICES_MENU.map((item) => (
                  <li key={item.href} className="rounded-2xl">
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                        isActive(item.href) ? "bg-brand-soft" : "hover:bg-surface-soft"
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">{t(item.key)}</span>
                        <span className="block text-xs leading-snug text-muted">{t(item.desc)}</span>
                      </span>
                    </Link>
                    {item.actions.length > 0 && (
                      <ul className="mb-1 ml-[3.75rem] mt-0.5 flex flex-wrap gap-2">
                        {item.actions.map((a) => (
                          <li key={a.href}>
                            <Link
                              href={a.href}
                              className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-white px-3 py-1.5 text-xs font-semibold text-brand-strong hover:bg-brand-soft"
                            >
                              {t(a.key)}
                              <Icon name="arrowRight" className="h-3.5 w-3.5" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </Accordion>

            <Accordion title={t("navInfo")} icon="info">
              <ul className="space-y-1">
                {INFO_MENU.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${
                        isActive(item.href) ? "bg-brand-soft" : "hover:bg-surface-soft"
                      }`}
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink">{t(item.key)}</span>
                        <span className="block text-xs leading-snug text-muted">{t(item.desc)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>

            {DIRECT_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold ${
                  isActive(l.href) ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-surface-soft"
                }`}
              >
                <Icon name={l.key === "navAbout" ? "users" : "mail"} className="h-5 w-5 text-brand" />
                {t(l.key)}
              </Link>
            ))}

            <div className="my-3 border-t border-line" />

            {!webTransfersEnabled ? null : !loading && user ? (
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

            <ButtonLink href="/application" size="lg" className={`w-full ${webTransfersEnabled ? "mt-3" : ""}`}>
              <WstGlyph className="h-5 w-5" />
              {ta("downloadApp")}
            </ButtonLink>

            <div className="mt-5 rounded-2xl border border-line p-4">
              <p className="text-sm font-semibold text-ink">{ta("ourApp")}</p>
              <p className="mt-1 text-sm text-muted">{ta("ourAppText")}</p>
              <StoreBadges className="mt-4" />
            </div>

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

/* -------------------------------------------------------------------------- */

/** Menu déroulant accessible : bouton + panneau, Échap, sortie du focus, clic extérieur (géré par le parent). */
function Dropdown({
  id,
  label,
  active,
  open,
  onToggle,
  onClose,
  panelClassName = "",
  children,
}: {
  id: MenuId;
  label: string;
  active: boolean;
  open: boolean;
  onToggle: (open: boolean) => void;
  onClose: () => void;
  panelClassName?: string;
  children: ReactNode;
}) {
  const uid = useId();
  const panelId = `menu-${id}-${uid}`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const focusFirst = () => {
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>("a,button")?.focus());
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          onClose();
          buttonRef.current?.focus();
        }
      }}
      onBlur={(e) => {
        if (open && !wrapRef.current?.contains(e.relatedTarget as Node | null)) onClose();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onToggle(true);
            focusFirst();
          }
        }}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
          open || active ? "bg-brand-soft text-brand-strong" : "text-ink/75 hover:bg-surface-soft hover:text-ink"
        }`}
      >
        {label}
        <Icon name="chevronDown" className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className={`absolute top-full mt-3 overflow-hidden rounded-3xl border border-line bg-white shadow-float ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

function ServicePanelItem({
  item,
  t,
  active,
  onNavigate,
}: {
  item: MenuItem;
  t: (key: CommonKey) => string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <div className={`flex h-full gap-3 rounded-2xl p-3 transition hover:bg-surface-soft ${active ? "bg-brand-soft/60" : ""}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-sky text-white">
        <Icon name={item.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className="rounded text-sm font-bold text-ink hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {t(item.key)}
        </Link>
        <p className="mt-0.5 text-xs leading-snug text-muted">{t(item.desc)}</p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {item.actions.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 rounded text-xs font-semibold text-brand hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {t(a.key)}
                <Icon name="arrowRight" className="h-3 w-3" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Accordion({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: IconName;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const panelId = `acc-${uid}`;
  return (
    <div className="rounded-2xl">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold text-ink hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <Icon name={icon} className="h-5 w-5 text-brand" />
        <span className="flex-1">{title}</span>
        <Icon name="chevronDown" className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={panelId} hidden={!open} className="pb-2 pl-1">
        {children}
      </div>
    </div>
  );
}

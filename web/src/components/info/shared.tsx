"use client";

import type { ReactNode } from "react";
import { useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import { localCountryName, localeTag } from "@/components/app/country-name";
import { formatMoney } from "@/lib/money";
import { showPlaceholders } from "@/lib/company";
import type { PayoutNetwork } from "@/lib/corridors";
import { useT } from "@/i18n/define";
import { infoCommon } from "@/i18n/info";
import type { RegionId } from "./regions";

/* -------------------------------------------------------------------------- */
/* Emplacement « À compléter »                                                 */
/* -------------------------------------------------------------------------- */

function PencilGlyph({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  );
}

/**
 * Texte sobre « À compléter » (italique gris + petite icône). Masqué si
 * NEXT_PUBLIC_HIDE_PLACEHOLDERS=true.
 */
export function ToComplete({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const t = useT(infoCommon);
  if (!showPlaceholders) return null;
  return (
    <span
      title={t("toCompleteHint")}
      className={`inline-flex items-center gap-1 text-sm italic ${light ? "text-white/45" : "text-muted/80"} ${className}`}
    >
      <PencilGlyph />
      {t("toComplete")}
    </span>
  );
}

/**
 * Affiche une valeur de la fiche entreprise : lien si `href` est fourni et la valeur
 * renseignée, texte simple sinon, et « À compléter » (jamais de lien vide) si nulle.
 */
export function CompanyValue({
  value,
  href,
  light = false,
  className = "",
  external = false,
}: {
  value: string | null;
  href?: string | null;
  light?: boolean;
  className?: string;
  external?: boolean;
}) {
  if (!value) return <ToComplete light={light} />;
  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {value}
      </a>
    );
  }
  return <span className={className}>{value}</span>;
}

/* -------------------------------------------------------------------------- */
/* Libellés : délais, réseaux, régions, montants                               */
/* -------------------------------------------------------------------------- */

export function useInfoLabels() {
  const t = useT(infoCommon);
  const { locale } = useI18n();

  const delivery = useCallback(
    (estimate: string) => {
      if (/minute/i.test(estimate)) return t("deliveryMinutes");
      if (/24/.test(estimate)) return t("deliveryUnder24h");
      if (/business day/i.test(estimate)) return t("deliveryBank");
      return estimate;
    },
    [t],
  );

  const network = useCallback(
    (n: Pick<PayoutNetwork, "id" | "label" | "type">) => {
      if (n.type === "bank") return t("netBank");
      if (n.type === "cash") return t("netCash");
      return n.label;
    },
    [t],
  );

  const networkType = useCallback(
    (type: PayoutNetwork["type"]) =>
      type === "bank" ? t("typeBank") : type === "cash" ? t("typeCash") : t("typeMobileMoney"),
    [t],
  );

  const region = useCallback(
    (id: RegionId) => {
      const map: Record<RegionId, Parameters<typeof t>[0]> = {
        central: "regionCentral",
        west: "regionWest",
        east: "regionEast",
        southern: "regionSouthern",
        north: "regionNorth",
        asia: "regionAsia",
        caribbean: "regionCaribbean",
        other: "regionOther",
      };
      return t(map[id]);
    },
    [t],
  );

  const country = useCallback(
    (code: string, fallback?: string) => localCountryName(code, locale, fallback),
    [locale],
  );

  const money = useCallback(
    (n: number, currency: string) => formatMoney(n, currency, localeTag(locale)),
    [locale],
  );

  const currencyName = useCallback(
    (code: string) => {
      try {
        return new Intl.DisplayNames([localeTag(locale)], { type: "currency" }).of(code) ?? code;
      } catch {
        return code;
      }
    },
    [locale],
  );

  const number = useCallback(
    (n: number, digits = 2) =>
      new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: digits }).format(n),
    [locale],
  );

  const date = useCallback(
    (iso: string) => {
      try {
        return new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
      } catch {
        return iso;
      }
    },
    [locale],
  );

  return { t, locale, delivery, network, networkType, region, country, money, currencyName, number, date };
}

/** Rang de rapidité (pour trier par délai). */
export function deliveryRank(estimate: string): number {
  if (/minute/i.test(estimate)) return 0;
  if (/24/.test(estimate)) return 1;
  return 2;
}

/** Normalise pour la recherche (minuscules, sans accents). */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* Champ de recherche                                                          */
/* -------------------------------------------------------------------------- */

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  large = false,
  className = "",
}: {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  large?: boolean;
  className?: string;
}) {
  const t = useT(infoCommon);
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted ${large ? "h-5 w-5" : "h-4 w-4"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`block w-full rounded-full border border-line bg-white text-ink shadow-sm placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 [&::-webkit-search-cancel-button]:hidden ${
            large ? "py-4 pl-12 pr-12 text-base" : "py-2.5 pl-10 pr-10 text-base sm:text-sm"
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={t("searchClear")}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Texte riche minimal : paragraphes (ligne vide) et puces (« - »)             */
/* -------------------------------------------------------------------------- */

export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className={`grid gap-4 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const nodes: ReactNode[] = [];
        let bullets: string[] = [];
        const flush = (key: string) => {
          if (!bullets.length) return;
          nodes.push(
            <ul key={key} className="grid gap-2">
              {bullets.map((b, i) => (
                <li key={`${i}-${b.slice(0, 12)}`} className="flex gap-3">
                  <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>,
          );
          bullets = [];
        };
        lines.forEach((line, li) => {
          if (line.startsWith("- ")) bullets.push(line.slice(2));
          else {
            flush(`u${li}`);
            if (line.trim()) nodes.push(<p key={`p${li}`}>{line}</p>);
          }
        });
        flush("end");
        return (
          <div key={bi} className="grid gap-2">
            {nodes}
          </div>
        );
      })}
    </div>
  );
}

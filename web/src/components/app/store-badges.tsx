"use client";

import { appLinks } from "@/lib/app-links";
import { appMessages } from "@/i18n/app";
import { useT } from "@/i18n/define";

/** Pictogramme pomme simplifié (dessin maison, pas le logo officiel). */
function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.2.8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.5 1.3-2.6 0 0-2.4-.9-2.4-3.7zM14.2 5.6c.6-.8 1.1-1.8 1-2.9-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.8 1 .1 2.1-.5 2.7-1.3z" />
    </svg>
  );
}

/** Triangle « lecture » multicolore simplifié (dessin maison). */
function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 2.8v18.4c0 .4.4.6.7.4L15 12 4.7 2.4c-.3-.2-.7 0-.7.4z" fill="#3fa0ff" />
      <path d="M15 12l3.6-3.4-12-6.6L15 12z" fill="#22c55e" />
      <path d="M15 12l-8.4 10L18.6 15.4 15 12z" fill="#e11d2b" />
      <path d="M18.6 8.6L15 12l3.6 3.4 2.6-1.5c.9-.5.9-1.4 0-1.9l-2.6-1.4z" fill="#f5b400" />
    </svg>
  );
}

type Badge = { key: "ios" | "android"; href: string | null; small: string; big: string; glyph: "apple" | "play" };

/** Boutons App Store / Google Play (style maison), désactivés avec « Bientôt » si le lien manque. */
export function StoreBadges({ dark = false, className = "" }: { dark?: boolean; className?: string }) {
  const t = useT(appMessages);
  const badges: Badge[] = [
    { key: "ios", href: appLinks.ios, small: t("downloadOn"), big: t("appStore"), glyph: "apple" },
    { key: "android", href: appLinks.android, small: t("getItOn"), big: t("googlePlay"), glyph: "play" },
  ];

  const base =
    "relative inline-flex min-w-[10.5rem] items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  const enabled = dark
    ? "border-white/25 bg-white text-navy hover:bg-brand-soft"
    : "border-navy bg-navy text-white hover:bg-navy-deep";
  const disabled = dark
    ? "cursor-not-allowed border-white/15 bg-white/5 text-white/60"
    : "cursor-not-allowed border-line bg-surface-soft text-muted";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {badges.map((b) => {
        const content = (
          <>
            {b.glyph === "apple" ? <AppleGlyph className="h-7 w-7 shrink-0" /> : <PlayGlyph className="h-6 w-6 shrink-0" />}
            <span className="leading-tight">
              <span className="block text-[0.65rem] font-medium opacity-80">{b.small}</span>
              <span className="block font-display text-base font-bold">{b.big}</span>
            </span>
            {!b.href && (
              <span
                className={`absolute -right-2 -top-2 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${
                  dark ? "bg-sky text-navy" : "bg-brand text-white"
                }`}
              >
                {t("soon")}
              </span>
            )}
          </>
        );
        return b.href ? (
          <a key={b.key} href={b.href} target="_blank" rel="noopener noreferrer" className={`${base} ${enabled}`}>
            {content}
          </a>
        ) : (
          <span key={b.key} aria-disabled="true" className={`${base} ${disabled}`}>
            {content}
          </span>
        );
      })}
    </div>
  );
}

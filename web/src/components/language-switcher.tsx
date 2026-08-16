"use client";

import { CountryFlag } from "@/components/country-flag";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, locale, setLocale } = useI18n();
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <label
      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-2.5 py-1.5 text-sm text-ink"
      title={t("language")}
    >
      <CountryFlag code={current.flag} size={18} title={current.label} />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="max-w-[7.5rem] bg-transparent font-medium outline-none"
        aria-label={t("language")}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {compact ? l.short : l.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LanguageFlagButtons({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { locale, setLocale } = useI18n();
  const dark = variant === "dark";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLocale(l.code)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
            locale === l.code
              ? dark
                ? "border-accent bg-accent text-white"
                : "border-accent bg-accent-soft text-accent-strong"
              : dark
                ? "border-white/20 bg-white/10 text-white/80 hover:bg-white/15"
                : "border-line bg-white text-ink-muted hover:border-accent/40"
          }`}
        >
          <CountryFlag code={l.flag} size={16} title={l.label} />
          {l.short}
        </button>
      ))}
    </div>
  );
}

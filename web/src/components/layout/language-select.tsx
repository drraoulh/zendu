"use client";

import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/ui/icon";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSelect({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <label
      className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold ${
        dark ? "border-white/20 bg-white/10 text-white" : "border-line bg-white text-ink"
      }`}
    >
      <Icon name="globe" className="h-4 w-4 opacity-70" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="cursor-pointer appearance-none bg-transparent pr-4 outline-none"
        aria-label="Langue / Language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="text-ink">
            {l.short}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 opacity-60" />
    </label>
  );
}

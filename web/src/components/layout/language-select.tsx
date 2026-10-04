"use client";

import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/ui/icon";
import { LOCALES, type Locale } from "@/lib/i18n";

export function LanguageSelect({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useI18n();
  return (
    <label
      className={`relative inline-flex items-center rounded-full border text-sm font-semibold has-[:focus-visible]:ring-2 ${
        dark ? "border-white/20 bg-white/10 text-white has-[:focus-visible]:ring-white/60" : "border-line bg-white text-ink has-[:focus-visible]:ring-brand/50"
      }`}
    >
      <Icon name="globe" className="pointer-events-none absolute left-3 h-4 w-4 opacity-70" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="min-h-10 cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pl-[2.125rem] pr-7 outline-none sm:min-h-0"
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

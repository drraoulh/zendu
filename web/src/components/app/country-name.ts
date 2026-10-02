import type { Locale } from "@/lib/i18n";

const TAGS: Record<Locale, string> = { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" };
const cache = new Map<string, Intl.DisplayNames | null>();

export function localeTag(locale: Locale): string {
  return TAGS[locale] ?? "fr-CA";
}

/** Nom de pays traduit (Intl.DisplayNames), avec repli sur le nom fourni. */
export function localCountryName(code: string, locale: Locale, fallback?: string): string {
  const tag = localeTag(locale);
  if (!cache.has(tag)) {
    try {
      cache.set(tag, new Intl.DisplayNames([tag], { type: "region" }));
    } catch {
      cache.set(tag, null);
    }
  }
  try {
    return cache.get(tag)?.of(code) ?? fallback ?? code;
  } catch {
    return fallback ?? code;
  }
}

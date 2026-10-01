"use client";

import { useCallback } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

/**
 * Dictionnaires par page/composant. Le français fait foi, l'anglais est obligatoire,
 * l'espagnol et le chinois peuvent être partiels (repli sur l'anglais).
 */
export type MessageBundle<K extends string> = {
  fr: Record<K, string>;
  en: Record<K, string>;
  es?: Partial<Record<K, string>>;
  zh?: Partial<Record<K, string>>;
};

export function defineMessages<K extends string>(bundle: MessageBundle<K>) {
  return bundle;
}

export function translate<K extends string>(
  bundle: MessageBundle<K>,
  locale: Locale,
  key: K,
  vars?: Record<string, string | number>,
): string {
  let text = bundle[locale]?.[key] ?? bundle.en[key] ?? bundle.fr[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** `const t = useT(messages); t("title")` ou `t("hello", { name })` pour `{name}`. */
export function useT<K extends string>(bundle: MessageBundle<K>) {
  const { locale } = useI18n();
  return useCallback(
    (key: K, vars?: Record<string, string | number>) => translate(bundle, locale, key, vars),
    [bundle, locale],
  );
}

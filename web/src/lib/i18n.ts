export type Locale = "fr" | "en" | "es" | "zh";

export const LOCALES: {
  code: Locale;
  label: string;
  short: string;
  flag: string;
}[] = [
  { code: "fr", label: "Français", short: "FR", flag: "fr" },
  { code: "en", label: "English", short: "EN", flag: "gb" },
  { code: "es", label: "Español", short: "ES", flag: "es" },
  { code: "zh", label: "中文", short: "中文", flag: "cn" },
];

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.code === value);
}

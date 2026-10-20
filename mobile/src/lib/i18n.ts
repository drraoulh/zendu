import { getLocales } from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";
import zh from "@/i18n/zh.json";

/**
 * Traductions de l'appli. Le texte français du code sert de clé : `tr("Envoyer à {0}", nom)`.
 * Une phrase absente d'un dictionnaire reste en français (jamais de clé technique affichée).
 *
 * La langue est lue de façon synchrone au démarrage (réglage enregistré, sinon langue du téléphone),
 * pour que les textes définis au chargement des modules soient déjà dans la bonne langue. Un changement
 * de langue redessine toute l'appli (voir app/_layout.tsx).
 */
export type Lang = "fr" | "en" | "es" | "zh";
export const LANGS: Lang[] = ["fr", "en", "es", "zh"];

type Dict = Record<string, string>;
const DICTS: Record<Exclude<Lang, "fr">, Dict> = { en, es, zh };

/** Texte déjà traduit (dans n'importe quelle langue) → clé française, pour retraduire après un changement de langue. */
const REVERSE = new Map<string, string>();
for (const dict of Object.values(DICTS)) for (const [fr, value] of Object.entries(dict)) if (!REVERSE.has(value)) REVERSE.set(value, fr);

const KEY_SETTINGS = "wst.settings";

function isLang(v: unknown): v is Lang {
  return v === "fr" || v === "en" || v === "es" || v === "zh";
}

/** Langue du téléphone si elle est proposée, sinon le français. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? "fr";
    return isLang(code) ? code : "fr";
  } catch {
    return "fr";
  }
}

function storedLang(): Lang | null {
  try {
    const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(KEY_SETTINGS) : SecureStore.getItem(KEY_SETTINGS);
    const lang = raw ? (JSON.parse(raw) as { language?: unknown }).language : null;
    return isLang(lang) ? lang : null;
  } catch {
    return null;
  }
}

let current: Lang = storedLang() ?? deviceLang();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  current = lang;
}

/** Locale Intl de la langue courante (dates, nombres). */
export function intlLocale(): string {
  return { fr: "fr-CA", en: "en-CA", es: "es", zh: "zh-CN" }[current];
}

function fill(text: string, args: unknown[]): string {
  return args.length ? text.replace(/\{(\d+)\}/g, (m, i: string) => (Number(i) < args.length ? String(args[Number(i)] ?? "") : m)) : text;
}

function lookup(text: string): string {
  if (current === "fr") return text in DICTS.en ? text : (REVERSE.get(text) ?? text);
  const dict = DICTS[current];
  const hit = dict[text];
  if (hit !== undefined) return hit;
  const key = REVERSE.get(text);
  return key !== undefined ? (dict[key] ?? key) : text;
}

/**
 * Traduit un texte (clé = phrase française, {0}, {1}… pour les valeurs). Toute autre valeur
 * (nombre, élément, nom saisi par le client…) est renvoyée telle quelle.
 */
export function tr(text: string, ...args: unknown[]): string;
export function tr<T>(value: T): T;
export function tr(value: unknown, ...args: unknown[]): unknown {
  if (typeof value !== "string" || !value) return value;
  return fill(lookup(value), args);
}

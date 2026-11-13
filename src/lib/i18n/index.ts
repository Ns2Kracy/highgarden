import { createSignal } from "solid-js";
import { en, type Messages } from "./en";
import { zhCN } from "./zh-CN";

export type { Messages };

/** The languages the interface ships with. Labels stay in their own language. */
export const locales = [
  { id: "en", label: "English" },
  { id: "zh-CN", label: "简体中文" },
] as const;

export type Locale = (typeof locales)[number]["id"];

const catalogs: Record<Locale, Messages> = {
  en,
  "zh-CN": zhCN,
};

const ids = locales.map((entry) => entry.id);

/** Every dotted key of the English messages, checked at compile time. */
type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

export type MessageParams = Record<string, string | number>;

/**
 * The BCP 47 tag of the language the system asks for, or English. The stored
 * preference wins over this once `startPreferences` has run.
 */
export function detectLocale(tags?: readonly string[]): Locale {
  const candidates = tags ?? (typeof navigator === "undefined" ? [] : (navigator.languages ?? []));
  for (const tag of candidates) {
    const normalized = tag.toLowerCase().replace("_", "-");
    if (normalized.startsWith("zh")) return "zh-CN";
    if (normalized.startsWith("en")) return "en";
  }
  return "en";
}

/** Whether a stored or hand-edited value names a language we ship. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && ids.includes(value as Locale);
}

const [locale, setLocaleSignal] = createSignal<Locale>(detectLocale());

/** The language the interface renders in, as a reactive value. */
export { locale };

/**
 * Switches the interface language. `src/lib/preferences.ts` decides when to
 * store it; this only changes what is rendered, and the `lang` attribute so
 * screen readers and hyphenation follow.
 */
export function setLocale(next: Locale): void {
  if (!isLocale(next)) return;
  setLocaleSignal(next);
  if (typeof document !== "undefined") document.documentElement.lang = next;
}

function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function fill(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * The message of `key` in the current language, with `{placeholders}`
 * filled. Read inside JSX or a memo and the view follows `setLocale`.
 * A key missing from a catalog falls back to English, then to the key itself.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  const message = lookup(catalogs[locale()], key) ?? lookup(en, key) ?? key;
  return fill(message, params);
}

/**
 * Whether the catalogs know `key`. Used where a key is derived from data,
 * such as `tools.<id>.title` for a registry entry, so an untranslated tool
 * keeps the title it declares instead of showing a key.
 */
export function hasMessage(key: string): boolean {
  return lookup(en, key) !== undefined;
}

/** A localised number, for counts and versions read by people. */
export function formatNumber(value: number): string {
  return value.toLocaleString(locale());
}

import { isMyGo } from "mygo-runtime";
import { createSignal } from "solid-js";
import { Preferences, type Prefs } from "@/mygo";
import { isLocale, locale, setLocale } from "./i18n";
import { applyTheme, type ThemeMode } from "./theme";

export const accents = [
  { id: "blue", swatch: "#2563eb" },
  { id: "violet", swatch: "#7c3aed" },
  { id: "emerald", swatch: "#059669" },
  { id: "amber", swatch: "#d97706" },
  { id: "rose", swatch: "#e11d48" },
  { id: "slate", swatch: "#475569" },
] as const;

export const themes: readonly ThemeMode[] = ["system", "light", "dark"];

export type Accent = (typeof accents)[number]["id"];

const STORAGE_KEY = "highgarden.preferences";
const recentLimit = 8;

const accentIds = accents.map((accent) => accent.id);

function sanitize(input: Partial<Prefs> | null | undefined): Prefs {
  const theme = themes.includes(input?.theme as ThemeMode)
    ? (input?.theme as ThemeMode)
    : "system";
  const accent = accentIds.includes(input?.accent as Accent) ? (input?.accent as Accent) : "blue";
  // An unset or unknown locale keeps the language the system asks for.
  const language = isLocale(input?.locale) ? input.locale : locale();
  const recent: string[] = [];
  for (const id of input?.recent ?? []) {
    if (typeof id === "string" && id && !recent.includes(id)) recent.push(id);
    if (recent.length === recentLimit) break;
  }
  return {
    theme,
    accent,
    locale: language,
    recent,
    sidebarCollapsed: Boolean(input?.sidebarCollapsed),
  };
}

function readLocal(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitize(raw ? (JSON.parse(raw) as Partial<Prefs>) : null);
  } catch {
    return sanitize(null);
  }
}

function writeLocal(prefs: Prefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // The Go preferences still save; storage can be unavailable.
  }
}

const [prefs, setPrefs] = createSignal<Prefs>(readLocal());
const [hydrated, setHydrated] = createSignal(false);

/** The current preferences. Reading it in JSX keeps the view current. */
export { prefs, hydrated };

/** Applies the language of the preferences, when they name one we ship. */
function applyLocale(next: Prefs): void {
  if (isLocale(next.locale)) setLocale(next.locale);
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let started = false;

/** Replaces the preferences, applies the theme and language, and saves them. */
export function updatePreferences(patch: Partial<Prefs>): void {
  const next = sanitize({ ...prefs(), ...patch });
  setPrefs(next);
  applyLocale(next);
  applyTheme(next.theme as ThemeMode, next.accent);
  writeLocal(next);
  if (!isMyGo()) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    Preferences.set(next).catch((err: unknown) => {
      console.warn("Could not save preferences:", err);
    });
  }, 200);
}

/** Moves a tool to the top of the recent list. */
export function recordRecent(id: string): void {
  const current = prefs().recent.filter((item) => item !== id);
  updatePreferences({ recent: [id, ...current].slice(0, recentLimit) });
}

/** Toggles the sidebar and remembers it. */
export function toggleSidebar(): void {
  updatePreferences({ sidebarCollapsed: !prefs().sidebarCollapsed });
}

/**
 * Loads the preferences from Go and applies them. Call once at startup:
 * until it resolves the local mirror from index.html keeps the right theme,
 * and the detected language keeps the right words.
 */
export function startPreferences(): void {
  if (started) return;
  started = true;
  const local = prefs();
  applyLocale(local);
  applyTheme(local.theme as ThemeMode, local.accent);

  if (!isMyGo()) {
    setHydrated(true);
    return;
  }

  Preferences.get()
    .then((stored) => {
      const next = sanitize(stored);
      setPrefs(next);
      applyLocale(next);
      applyTheme(next.theme as ThemeMode, next.accent);
      writeLocal(next);
    })
    .catch((err: unknown) => {
      console.warn("Could not load preferences:", err);
    })
    .finally(() => setHydrated(true));
}

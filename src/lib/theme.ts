export type ThemeMode = "system" | "light" | "dark";

const media = () => window.matchMedia("(prefers-color-scheme: dark)");

let systemListener: (() => void) | null = null;

/** Reports whether the desktop asks for a dark color scheme. */
export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && media().matches;
}

/**
 * Applies the theme to the document. The inline script in index.html does
 * the same before the first frame; this keeps it current after a change and
 * follows the desktop while the theme is "system".
 */
export function applyTheme(theme: ThemeMode, accent: string): void {
  const dark = theme === "dark" || (theme === "system" && systemPrefersDark());
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.accent = accent;
  root.style.colorScheme = dark ? "dark" : "light";

  if (systemListener) {
    media().removeEventListener("change", systemListener);
    systemListener = null;
  }
  if (theme === "system") {
    systemListener = () => root.classList.toggle("dark", systemPrefersDark());
    media().addEventListener("change", systemListener);
  }
}

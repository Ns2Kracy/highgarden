import { useQuery } from "@tanstack/solid-query";
import { For, Show, createSignal } from "solid-js";
import { IconExternal, IconMonitor, IconMoon, IconSun } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Segmented,
} from "@/components/ui";
import { locales, locale, t, type MessageKey } from "@/lib/i18n";
import { openDataDir, systemInfo } from "@/lib/system";
import { accents, hydrated, prefs, themes, updatePreferences } from "@/lib/preferences";
import type { ThemeMode } from "@/lib/theme";

const themeIcons = {
  system: IconMonitor,
  light: IconSun,
  dark: IconMoon,
} as const;

const algorithms: { id: string; note: MessageKey }[] = [
  { id: "sha256", note: "settings.native.noteNativeAndGo" },
  { id: "sha512", note: "settings.native.noteNativeAndGo" },
  { id: "blake3", note: "settings.native.noteNativeOnly" },
];

export default function SettingsPage() {
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));
  const [error, setError] = createSignal<string | null>(null);

  const showDataDir = () => {
    setError(null);
    openDataDir().catch((err: unknown) =>
      setError(err instanceof Error ? err.message : String(err)),
    );
  };

  const about = () => [
    { label: t("settings.about.appVersion"), value: info.data ? `v${info.data.appVersion}` : "…" },
    { label: t("settings.about.go"), value: info.data?.goVersion ?? "…" },
    {
      label: t("settings.about.platform"),
      value: info.data ? `${info.data.os}/${info.data.arch}` : "…",
    },
    { label: t("settings.about.host"), value: info.data?.hostname ?? "…" },
    {
      label: t("settings.about.build"),
      value: info.data?.packaged
        ? t("settings.about.packaged")
        : t("settings.about.development"),
    },
    { label: t("settings.about.cpus"), value: info.data ? String(info.data.numCPU) : "…" },
  ];

  return (
    <div class="mx-auto w-full max-w-3xl px-6 py-8">
      <header class="mb-6">
        <h1 class="text-xl font-semibold tracking-tight">{t("settings.title")}</h1>
        <p class="mt-1 text-sm text-muted">{t("settings.subtitle")}</p>
      </header>

      <div class="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.appearance.title")}</CardTitle>
              <p class="mt-0.5 text-xs text-muted">{t("settings.appearance.description")}</p>
            </div>
            <Show when={hydrated()}>
              <Badge tone="success">{t("settings.appearance.synced")}</Badge>
            </Show>
          </CardHeader>
          <CardBody class="flex flex-col gap-5">
            <Field label={t("settings.appearance.theme")}>
              <Segmented
                ariaLabel={t("settings.appearance.theme")}
                value={prefs().theme as ThemeMode}
                options={themes.map((theme) => ({
                  value: theme,
                  label: t(`settings.theme.${theme}`),
                  icon: themeIcons[theme],
                }))}
                onChange={(theme) => updatePreferences({ theme })}
              />
            </Field>

            <Field label={t("settings.appearance.accent")}>
              <div class="flex flex-wrap gap-2">
                <For each={accents}>
                  {(accent) => (
                    <button
                      type="button"
                      aria-label={t(`settings.accent.${accent.id}`)}
                      title={t(`settings.accent.${accent.id}`)}
                      class="grid size-8 place-items-center rounded-full border-2 transition-transform hover:scale-105"
                      style={{
                        "background-color": accent.swatch,
                        "border-color":
                          prefs().accent === accent.id
                            ? "var(--fg)"
                            : "color-mix(in oklab, var(--fg) 12%, transparent)",
                      }}
                      onClick={() => updatePreferences({ accent: accent.id })}
                    >
                      <Show when={prefs().accent === accent.id}>
                        <svg
                          viewBox="0 0 24 24"
                          class="size-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <path d="m20 6-11 11-5-5" />
                        </svg>
                      </Show>
                    </button>
                  )}
                </For>
              </div>
            </Field>

            <Field
              label={t("settings.appearance.language")}
              hint={t("settings.appearance.languageHint")}
            >
              <Segmented
                ariaLabel={t("settings.appearance.language")}
                value={locale()}
                options={locales.map((entry) => ({ value: entry.id, label: entry.label }))}
                onChange={(next) => updatePreferences({ locale: next })}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t("settings.native.title")}</CardTitle>
              <p class="mt-0.5 text-xs text-muted">
                {t("settings.native.descriptionPrefix")}{" "}
                <code class="font-mono">modules/hasher</code>{" "}
                {t("settings.native.descriptionSuffix")}
              </p>
            </div>
            <Badge tone={info.data?.engine === "rust" ? "success" : "warning"}>
              {info.data?.engine === "rust"
                ? t("settings.native.loaded")
                : t("settings.native.fallback")}
            </Badge>
          </CardHeader>
          <CardBody class="flex flex-col gap-3">
            <Field label={t("settings.native.algorithms")}>
              <div class="divide-y divide-border overflow-hidden rounded-lg border border-border">
                <For each={algorithms}>
                  {(algorithm) => (
                    <div class="flex items-center justify-between gap-3 px-3 py-2">
                      <span class="font-mono text-xs text-fg">{algorithm.id}</span>
                      <span class="text-[11px] text-muted">{t(algorithm.note)}</span>
                    </div>
                  )}
                </For>
              </div>
            </Field>
            <p class="text-xs leading-relaxed text-muted">{t("settings.native.body")}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.data.title")}</CardTitle>
          </CardHeader>
          <CardBody class="flex flex-col gap-4">
            <Field
              label={t("settings.data.directory")}
              hint={t("settings.data.directoryHint")}
            >
              <div class="flex gap-2">
                <Input readonly value={info.data?.dataDir ?? ""} class="font-mono text-xs" />
                <Button variant="secondary" onClick={showDataDir}>
                  <IconExternal class="size-3.5" />
                  {t("settings.data.open")}
                </Button>
              </div>
            </Field>
            <Show when={error()}>
              {(message) => <p class="text-xs text-danger">{message()}</p>}
            </Show>

            <div class="flex items-center justify-between gap-4 border-t border-border pt-4">
              <div>
                <p class="text-sm font-medium text-fg">{t("settings.data.recent")}</p>
                <p class="text-xs text-muted">
                  {prefs().recent.length
                    ? t("settings.data.recentCount", { count: prefs().recent.length })
                    : t("settings.data.recentEmpty")}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={prefs().recent.length === 0}
                onClick={() => updatePreferences({ recent: [] })}
              >
                {t("settings.data.clear")}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.about.title")}</CardTitle>
          </CardHeader>
          <CardBody>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
              <For each={about()}>
                {(row) => (
                  <div class="flex items-baseline justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
                    <dt class="shrink-0 text-muted">{row.label}</dt>
                    <dd class="truncate text-right font-mono text-[11px] text-fg">{row.value}</dd>
                  </div>
                )}
              </For>
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

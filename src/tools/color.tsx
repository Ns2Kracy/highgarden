import { For, Show, createMemo, createSignal } from "solid-js";
import { IconWarning } from "@/components/icons";
import { Badge, CopyButton, Field, Input } from "@/components/ui";
import { parseHex, readableOn, rgbToHex, rgbToHsl, scaleOf } from "@/lib/color";
import { t } from "@/lib/i18n";

const initial = "#2563eb";

export default function ColorTool() {
  const [draft, setDraft] = createSignal(initial);

  const rgb = createMemo(() => parseHex(draft()));
  const hex = createMemo(() => {
    const value = rgb();
    return value ? rgbToHex(value) : null;
  });
  const hsl = createMemo(() => {
    const value = rgb();
    return value ? rgbToHsl(value) : null;
  });
  const scale = createMemo(() => {
    const value = hsl();
    return value ? scaleOf(value) : [];
  });

  const values = createMemo(() => {
    const value = rgb();
    const hslValue = hsl();
    if (!value || !hslValue) return [];
    const r = Math.round(value.r);
    const g = Math.round(value.g);
    const b = Math.round(value.b);
    return [
      { label: "HEX", value: rgbToHex(value) },
      { label: "RGB", value: `rgb(${r} ${g} ${b})` },
      {
        label: "HSL",
        value: `hsl(${hslValue.h.toFixed(0)} ${hslValue.s.toFixed(1)}% ${hslValue.l.toFixed(1)}%)`,
      },
      { label: "CSS", value: `--color-500: ${hex()};` },
    ];
  });

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field
          label={t("tools.color.label")}
          hint={t("tools.color.hint")}
          class="min-w-56 flex-1"
        >
          <div class="flex gap-2">
            <label class="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border">
              <span
                class="absolute inset-0"
                style={{ "background-color": hex() ?? "transparent" }}
              />
              <input
                type="color"
                value={hex() ?? initial}
                onInput={(event) => setDraft(event.currentTarget.value)}
                class="absolute inset-0 cursor-pointer opacity-0"
                aria-label={t("tools.color.pick")}
              />
            </label>
            <Input
              value={draft()}
              onInput={(event) => setDraft(event.currentTarget.value)}
              placeholder="#2563eb"
              class="font-mono"
              spellcheck="false"
              aria-label={t("tools.color.hexLabel")}
            />
          </div>
        </Field>
        <Show when={hsl()}>
          {(value) => (
            <div class="flex items-center gap-2 pb-1">
              <Badge tone="neutral">H {value().h.toFixed(0)}°</Badge>
              <Badge tone="neutral">S {value().s.toFixed(0)}%</Badge>
              <Badge tone="neutral">L {value().l.toFixed(0)}%</Badge>
            </div>
          )}
        </Show>
      </div>

      <Show
        when={rgb()}
        fallback={
          <div class="flex gap-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>{t("tools.color.invalid")}</span>
          </div>
        }
      >
        <div class="overflow-hidden rounded-xl border border-border bg-surface">
          <ul class="divide-y divide-border">
            <For each={values()}>
              {(row) => (
                <li class="group flex items-center gap-3 px-3 py-2.5">
                  <span class="w-14 shrink-0 text-xs text-muted">{row.label}</span>
                  <span class="min-w-0 flex-1 break-all font-mono text-xs text-fg">
                    {row.value}
                  </span>
                  <CopyButton
                    value={row.value}
                    size="icon"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </li>
              )}
            </For>
            <li class="flex items-center gap-3 px-3 py-2.5">
              <span class="w-14 shrink-0 text-xs text-muted">{t("tools.color.preview")}</span>
              <span
                class="grid h-10 flex-1 place-items-center rounded-md border border-border text-sm font-semibold"
                style={{
                  "background-color": hex()!,
                  color: readableOn(rgb()!),
                }}
              >
                {t("tools.color.previewText")}
              </span>
            </li>
          </ul>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              {t("tools.color.scale")}
            </h2>
            <CopyButton
              label={t("tools.color.copyCss")}
              value={scale()
                .map((entry) => `  --color-${entry.stop}: ${entry.hex};`)
                .join("\n")}
            />
          </div>
          <div class="grid grid-cols-11 overflow-hidden rounded-lg border border-border">
            <For each={scale()}>
              {(entry) => (
                <button
                  type="button"
                  title={t("tools.color.swatchTitle", { hex: entry.hex })}
                  class="group/swatch flex h-16 flex-col items-center justify-end gap-0.5 pb-1 font-mono text-[9px] transition-transform"
                  style={{
                    "background-color": entry.hex,
                    color: entry.light ? "#111827" : "#f9fafb",
                  }}
                  onClick={() => setDraft(entry.hex)}
                >
                  <span class="font-semibold">{entry.stop}</span>
                  <span class="opacity-70">{entry.hex.slice(1)}</span>
                </button>
              )}
            </For>
          </div>
          <p class="text-[11px] text-faint">
            {t("tools.color.scaleNote")}
          </p>
        </div>
      </Show>
    </div>
  );
}

import { For, Show, createMemo, createSignal } from "solid-js";
import { IconClock, IconWarning } from "@/components/icons";
import { Badge, Button, CopyButton, Field, Input } from "@/components/ui";
import { locale, t, type MessageKey } from "@/lib/i18n";

type Parsed =
  | { date: Date; kind: "seconds" | "milliseconds" | "date" }
  | { error: MessageKey };

function parse(input: string): Parsed {
  const value = input.trim();
  if (!value) return { error: "tools.timestamp.errorEmpty" };

  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const number = Number(value);
    if (!Number.isFinite(number)) return { error: "tools.timestamp.errorRange" };
    const milliseconds = Math.abs(number) >= 1e11;
    const date = new Date(milliseconds ? number : number * 1000);
    if (Number.isNaN(date.getTime())) return { error: "tools.timestamp.errorTimestampRange" };
    return { date, kind: milliseconds ? "milliseconds" : "seconds" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: "tools.timestamp.errorUnknown" };
  }
  return { date, kind: "date" };
}

function relative(date: Date): string {
  const difference = date.getTime() - Date.now();
  const absolute = Math.abs(difference);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
  ];
  const format = new Intl.RelativeTimeFormat(locale(), { numeric: "auto" });
  for (const [unit, size] of units) {
    if (absolute >= size) return format.format(Math.round(difference / size), unit);
  }
  return t("tools.timestamp.relativeNow");
}

const now = () => String(Math.floor(Date.now() / 1000));

export default function TimestampTool() {
  const [input, setInput] = createSignal(now());
  const parsed = createMemo(() => parse(input()));

  const rows = createMemo(() => {
    const result = parsed();
    if ("error" in result) return [];
    const date = result.date;
    return [
      {
        label: t("tools.timestamp.unixSeconds"),
        value: String(Math.floor(date.getTime() / 1000)),
      },
      { label: t("tools.timestamp.unixMilliseconds"), value: String(date.getTime()) },
      { label: t("tools.timestamp.iso"), value: date.toISOString() },
      {
        label: t("tools.timestamp.local"),
        value: date.toLocaleString(locale(), { dateStyle: "full", timeStyle: "medium" }),
      },
      { label: t("tools.timestamp.utc"), value: date.toUTCString() },
      { label: t("tools.timestamp.relative"), value: relative(date) },
    ];
  });

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field
          label={t("tools.timestamp.label")}
          hint={t("tools.timestamp.hint")}
          class="min-w-64 flex-1"
        >
          <div class="flex gap-2">
            <Input
              value={input()}
              onInput={(event) => setInput(event.currentTarget.value)}
              placeholder={t("tools.timestamp.placeholder")}
              class="font-mono"
              aria-label={t("tools.timestamp.label")}
            />
            <Button onClick={() => setInput(now())}>
              <IconClock class="size-3.5" />
              {t("tools.timestamp.now")}
            </Button>
          </div>
        </Field>
        <Show when={!("error" in parsed())}>
          <Badge tone="accent" class="mb-2.5">
            {(parsed() as { kind: string }).kind === "milliseconds"
              ? t("tools.timestamp.kindMilliseconds")
              : (parsed() as { kind: string }).kind === "seconds"
                ? t("tools.timestamp.kindSeconds")
                : t("tools.timestamp.kindDate")}
          </Badge>
        </Show>
      </div>

      <Show
        when={"error" in parsed()}
        fallback={
          <div class="overflow-hidden rounded-xl border border-border bg-surface">
            <ul class="divide-y divide-border">
              <For each={rows()}>
                {(row) => (
                  <li class="group flex items-center gap-3 px-3 py-2.5">
                    <span class="w-36 shrink-0 text-xs text-muted">{row.label}</span>
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
            </ul>
          </div>
        }
      >
        <div class="flex gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
          <IconWarning class="mt-0.5 size-3.5 shrink-0" />
          <span>{t((parsed() as { error: MessageKey }).error)}</span>
        </div>
      </Show>
    </div>
  );
}

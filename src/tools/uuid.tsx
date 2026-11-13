import { For, createSignal, onSettled } from "solid-js";
import { IconKeyRound, IconRefresh } from "@/components/icons";
import { Badge, Button, CopyButton, Field, Input, Switch } from "@/components/ui";
import { t } from "@/lib/i18n";

function makeId(hyphens: boolean, upper: boolean): string {
  let id: string = crypto.randomUUID();
  if (!hyphens) id = id.replaceAll("-", "");
  if (upper) id = id.toUpperCase();
  return id;
}

export default function UuidTool() {
  const [count, setCount] = createSignal(5);
  const [hyphens, setHyphens] = createSignal(true);
  const [upper, setUpper] = createSignal(false);
  const [ids, setIds] = createSignal<string[]>([]);

  const generate = () => {
    const size = Math.min(100, Math.max(1, Math.round(count()) || 1));
    setCount(size);
    setIds(Array.from({ length: size }, () => makeId(hyphens(), upper())));
  };

  onSettled(() => {
    generate();
  });

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-4">
        <Field label={t("tools.uuid.howMany")} class="w-28">
          <Input
            type="number"
            min={1}
            max={100}
            value={count()}
            onChange={(event) => setCount(Number(event.currentTarget.value))}
            aria-label={t("tools.uuid.countLabel")}
          />
        </Field>
        <Field label={t("tools.uuid.hyphens")}>
          <div class="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-surface px-3">
            <Switch
              checked={hyphens()}
              onChange={setHyphens}
              label={t("tools.uuid.hyphens")}
            />
            <span class="text-xs text-muted">
              {hyphens() ? t("tools.uuid.withDashes") : t("tools.uuid.plain")}
            </span>
          </div>
        </Field>
        <Field label={t("tools.uuid.case")}>
          <div class="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-surface px-3">
            <Switch checked={upper()} onChange={setUpper} label={t("tools.uuid.uppercase")} />
            <span class="text-xs text-muted">
              {upper() ? t("tools.uuid.uppercase") : t("tools.uuid.lowercase")}
            </span>
          </div>
        </Field>
        <div class="ml-auto flex items-center gap-2">
          <Badge tone="neutral">UUID v4</Badge>
          <Button variant="primary" onClick={generate}>
            <IconRefresh class="size-3.5" />
            {t("tools.uuid.generate")}
          </Button>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-border bg-surface">
        <div class="flex items-center justify-between border-b border-border bg-surface-2/60 px-3 py-2">
          <span class="flex items-center gap-2 text-xs text-muted">
            <IconKeyRound class="size-3.5" />
            {t("tools.uuid.count", { count: ids().length })}
          </span>
          <CopyButton value={ids().join("\n")} label={t("tools.uuid.copyAll")} />
        </div>
        <ul class="divide-y divide-border">
          <For each={ids()}>
            {(id) => (
              <li class="group flex items-center gap-2 px-3 py-1.5">
                <span class="flex-1 truncate font-mono text-xs text-fg">{id}</span>
                <CopyButton value={id} size="icon" class="opacity-0 group-hover:opacity-100" />
              </li>
            )}
          </For>
        </ul>
      </div>

      <p class="text-xs leading-relaxed text-muted">
        {t("tools.uuid.notePrefix")}{" "}
        <code class="font-mono">crypto.randomUUID()</code>
        {t("tools.uuid.noteSuffix")}
      </p>
    </div>
  );
}

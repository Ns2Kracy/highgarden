import { useQuery } from "@tanstack/solid-query";
import { For, Show, createMemo, createSignal } from "solid-js";
import { IconExternal, IconRefresh, IconRocket, IconShield, IconWarning } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Segmented,
  Spinner,
  Switch,
} from "@/components/ui";
import { Startup, System, type StartupItem } from "@/mygo";
import { systemInfo } from "@/lib/system";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type Filter = "all" | "enabled" | "disabled";

export default function StartupTool() {
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));
  const items = useQuery(() => ({
    queryKey: ["startup-items"],
    queryFn: Startup.list,
    staleTime: 0,
  }));

  const [query, setQuery] = createSignal("");
  const [filter, setFilter] = createSignal<Filter>("all");
  const [pending, setPending] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const elevated = () => info.data?.elevated ?? false;

  const visible = createMemo(() => {
    const needle = query().trim().toLowerCase();
    return (items.data ?? []).filter((item) => {
      if (filter() === "enabled" && !item.enabled) return false;
      if (filter() === "disabled" && item.enabled) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.command.toLowerCase().includes(needle) ||
        item.location.toLowerCase().includes(needle)
      );
    });
  });

  const counts = () => {
    const all = items.data ?? [];
    return {
      all: all.length,
      enabled: all.filter((item) => item.enabled).length,
      disabled: all.filter((item) => !item.enabled).length,
    };
  };

  const toggle = async (item: StartupItem) => {
    setPending(item.id);
    setError(null);
    try {
      await Startup.setEnabled(item.id, !item.enabled);
      await items.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(null);
    }
  };

  const blocked = (item: StartupItem) => item.needsAdmin && !elevated();

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field label={t("common.search")} class="min-w-56 flex-1">
          <Input
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("tools.startup.searchPlaceholder")}
            aria-label={t("tools.startup.searchLabel")}
          />
        </Field>
        <Field label={t("tools.startup.show")}>
          <Segmented
            ariaLabel={t("tools.startup.showLabel")}
            value={filter()}
            options={[
              { value: "all", label: t("tools.startup.all", { count: counts().all }) },
              { value: "enabled", label: t("tools.startup.on", { count: counts().enabled }) },
              { value: "disabled", label: t("tools.startup.off", { count: counts().disabled }) },
            ]}
            onChange={setFilter}
          />
        </Field>
        <div class="flex items-center gap-2 pb-0.5">
          <Button variant="ghost" onClick={() => void items.refetch()} disabled={items.isFetching}>
            <IconRefresh class={items.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("common.refresh")}
          </Button>
          <Button variant="ghost" onClick={() => void System.openPage("startup")}>
            <IconExternal class="size-3.5" />
            {t("tools.startup.windowsStartup")}
          </Button>
        </div>
      </div>

      <Show when={!elevated()}>
        <div class="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-xs text-warning">
          <IconShield class="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t("tools.startup.needsAdminNote")}
          </span>
        </div>
      </Show>

      <Show
        when={!items.isError}
        fallback={
          <div class="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>
              {items.error instanceof Error
                ? items.error.message
                : t("tools.startup.readError")}
            </span>
          </div>
        }
      >
        <Card>
          <CardBody class="p-0">
            <Show
              when={!items.isPending}
              fallback={
                <div class="flex items-center gap-2 px-4 py-8 text-sm text-muted">
                  <Spinner /> {t("tools.startup.reading")}
                </div>
              }
            >
              <ul class="divide-y divide-border">
                <For each={visible()}>
                  {(item) => (
                    <li class="flex items-center gap-3 px-4 py-3">
                      <span
                        class={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg border",
                          item.enabled
                            ? "border-accent/20 bg-accent-soft text-accent"
                            : "border-border bg-surface-2 text-faint",
                        )}
                      >
                        <IconRocket class="size-4" />
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="truncate text-sm font-medium text-fg">{item.name}</span>
                          <Badge tone="neutral" class="px-1.5 py-0 text-[10px]">
                            {item.location}
                          </Badge>
                          <Show when={item.needsAdmin}>
                            <Badge tone={elevated() ? "success" : "warning"} class="px-1.5 py-0 text-[10px]">
                              <IconShield class="size-3" />
                              {t("tools.startup.machine")}
                            </Badge>
                          </Show>
                          <Show when={!item.enabled}>
                            <Badge tone="neutral" class="px-1.5 py-0 text-[10px]">
                              {t("tools.startup.disabledBy")}
                            </Badge>
                          </Show>
                        </div>
                        <p class="truncate font-mono text-[11px] text-muted">{item.command}</p>
                      </div>
                      <Switch
                        checked={item.enabled}
                        label={t("tools.startup.toggle", {
                          action: item.enabled
                            ? t("tools.startup.disable")
                            : t("tools.startup.enable"),
                          name: item.name,
                        })}
                        class={blocked(item) || pending() === item.id ? "opacity-50" : ""}
                        onChange={() => {
                          if (blocked(item) || pending() === item.id) return;
                          void toggle(item);
                        }}
                      />
                    </li>
                  )}
                </For>
              </ul>
              <Show when={visible().length === 0}>
                <p class="px-4 py-10 text-center text-sm text-muted">
                  {t("tools.startup.noMatch")}
                </p>
              </Show>
            </Show>
          </CardBody>
        </Card>
      </Show>

      <Show when={error()}>
        {(message) => (
          <div class="flex gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span class="break-all">{message()}</span>
          </div>
        )}
      </Show>

      <p class="text-[11px] leading-relaxed text-faint">
        {t("tools.startup.footerPrefix")}{" "}
        <code class="font-mono">Software\Highgarden\StartupDisabled</code>{" "}
        {t("tools.startup.footerMiddle")} <code class="font-mono">.disabled</code>{" "}
        {t("tools.startup.footerSuffix")}
      </p>
    </div>
  );
}

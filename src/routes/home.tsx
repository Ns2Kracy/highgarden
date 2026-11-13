import { Dynamic } from "@solidjs/web";
import { Link } from "@tanstack/solid-router";
import { useQuery } from "@tanstack/solid-query";
import { isMyGo } from "mygo-runtime";
import { For, Show } from "solid-js";
import {
  IconActivity,
  IconArrowRight,
  IconCommand,
  IconHardDrive,
  IconMemory,
  IconSearch,
  IconShield,
  IconSparkles,
} from "@/components/icons";
import { Badge, Button, Card, Kbd } from "@/components/ui";
import { System } from "@/mygo";
import { formatBytes } from "@/lib/encoding";
import { t } from "@/lib/i18n";
import { prefs } from "@/lib/preferences";
import { isMac } from "@/lib/platform";
import { openCommandPalette } from "@/lib/shell";
import { systemInfo } from "@/lib/system";
import { categories, categoryLabel, toolSummary, toolTitle, type Tool } from "@/framework/tool";
import { tools, toolsById, toolsInCategory } from "@/tools";

function ToolCard(props: { id: string }) {
  const tool = () => toolsById.get(props.id)!;
  return (
    <Link
      to="/tools/$toolId"
      params={{ toolId: props.id }}
      class="group flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-app transition-colors hover:border-border-strong hover:bg-surface-hover"
    >
      <div class="flex items-center gap-2.5">
        <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted transition-colors group-hover:text-accent">
          <Dynamic component={tool().icon} class="size-4" />
        </span>
        <span class="text-sm font-semibold text-fg">{toolTitle(tool())}</span>
        <Show when={tool().native}>
          <Badge tone="success" class="ml-auto px-1.5 py-0 text-[10px]">
            {t("common.native")}
          </Badge>
        </Show>
        <Show when={tool().windows && !tool().native}>
          <Badge tone="neutral" class="ml-auto px-1.5 py-0 text-[10px]">
            {t("common.windows")}
          </Badge>
        </Show>
      </div>
      <p class="text-xs leading-relaxed text-muted">{toolSummary(tool())}</p>
      <span class="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
        {t("home.open")}
        <IconArrowRight class="size-3" />
      </span>
    </Link>
  );
}

function StatBar(props: { value: number; warning?: boolean }) {
  return (
    <div class="h-1 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        class={props.warning ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-accent"}
        style={{ width: `${Math.min(100, Math.max(0, props.value)).toFixed(1)}%` }}
      />
    </div>
  );
}

function ratio(used: number, total: number): number {
  return total > 0 ? (used / total) * 100 : 0;
}

export default function HomePage() {
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));
  const overview = useQuery(() => ({
    queryKey: ["overview"],
    queryFn: () => (isMyGo() ? System.overview() : Promise.resolve(null)),
    refetchInterval: 5000,
    staleTime: 2000,
  }));

  const recent = () =>
    prefs()
      .recent.map((id) => toolsById.get(id))
      .filter((tool): tool is Tool => tool !== undefined);

  const systemDisk = () => {
    const disks = overview.data?.disks ?? [];
    return disks.find((disk) => disk.mountPoint.toUpperCase().startsWith("C:")) ?? disks[0];
  };

  return (
    <div class="mx-auto w-full max-w-5xl px-6 py-8">
      <section class="mb-8">
        <div class="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
          <IconSparkles class="size-3 text-accent" />
          Go · Solid · Rust
        </div>
        <h1 class="text-balance text-2xl font-semibold tracking-tight">{t("home.headline")}</h1>
        <p class="mt-1 max-w-xl text-sm leading-relaxed text-muted">{t("home.intro")}</p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={openCommandPalette}>
            <IconSearch class="size-4" />
            {t("home.findTool")}
            <span class="ml-1 flex items-center gap-1 opacity-70">
              <Kbd class="border-accent-fg/30 bg-accent-fg/15 text-accent-fg">
                {isMac ? "⌘" : "Ctrl"}
              </Kbd>
              <Kbd class="border-accent-fg/30 bg-accent-fg/15 text-accent-fg">K</Kbd>
            </span>
          </Button>
          <span class="text-xs text-faint">
            {t("home.toolsCount", { count: tools.length })}
            <Show when={info.data}>
              {" · "}
              {info.data!.engine === "rust" ? t("home.engineNative") : t("home.engineFallback")}
            </Show>
          </span>
        </div>
      </section>

      <Show when={overview.data}>
        {(data) => (
          <section class="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card class="flex flex-col gap-2 p-3.5">
              <div class="flex items-center justify-between text-[11px] text-muted">
                <span class="flex items-center gap-1.5">
                  <IconActivity class="size-3.5" />
                  {t("home.cpu")}
                </span>
                <span class="font-mono text-fg">{data().cpuUsage.toFixed(0)}%</span>
              </div>
              <StatBar value={data().cpuUsage} warning={data().cpuUsage > 85} />
              <span class="truncate text-[10px] text-faint">
                {t("home.coresProcesses", {
                  cores: data().cpuCores,
                  processes: data().processCount,
                })}
              </span>
            </Card>

            <Card class="flex flex-col gap-2 p-3.5">
              <div class="flex items-center justify-between text-[11px] text-muted">
                <span class="flex items-center gap-1.5">
                  <IconMemory class="size-3.5" />
                  {t("home.memory")}
                </span>
                <span class="font-mono text-fg">
                  {ratio(data().memoryUsed, data().memoryTotal).toFixed(0)}%
                </span>
              </div>
              <StatBar
                value={ratio(data().memoryUsed, data().memoryTotal)}
                warning={ratio(data().memoryUsed, data().memoryTotal) > 90}
              />
              <span class="text-[10px] text-faint">
                {t("home.memoryOf", {
                  used: formatBytes(data().memoryUsed),
                  total: formatBytes(data().memoryTotal),
                })}
              </span>
            </Card>

            <Card class="flex flex-col gap-2 p-3.5">
              <div class="flex items-center justify-between text-[11px] text-muted">
                <span class="flex items-center gap-1.5">
                  <IconHardDrive class="size-3.5" />
                  {systemDisk()?.mountPoint ?? t("home.disk")}
                </span>
                <span class="font-mono text-fg">
                  {systemDisk()
                    ? ratio(systemDisk()!.total - systemDisk()!.available, systemDisk()!.total).toFixed(0)
                    : "—"}
                  %
                </span>
              </div>
              <StatBar
                value={
                  systemDisk()
                    ? ratio(systemDisk()!.total - systemDisk()!.available, systemDisk()!.total)
                    : 0
                }
                warning={
                  systemDisk()
                    ? ratio(systemDisk()!.total - systemDisk()!.available, systemDisk()!.total) > 92
                    : false
                }
              />
              <span class="truncate text-[10px] text-faint">
                {systemDisk()
                  ? t("home.free", { size: formatBytes(systemDisk()!.available) })
                  : t("home.noDisks")}
              </span>
            </Card>

            <Card class="flex flex-col gap-2 p-3.5">
              <div class="flex items-center justify-between text-[11px] text-muted">
                <span class="flex items-center gap-1.5">
                  <IconShield class="size-3.5" />
                  {t("home.mode")}
                </span>
                <Badge tone={info.data?.elevated ? "success" : "neutral"} class="px-1.5 py-0 text-[10px]">
                  {info.data?.elevated ? t("home.administrator") : t("home.standard")}
                </Badge>
              </div>
              <span class="truncate text-xs text-fg">{data().hostname}</span>
              <span class="truncate text-[10px] text-faint">
                {data().osName} {data().osVersion}
              </span>
            </Card>
          </section>
        )}
      </Show>

      <Show when={recent().length > 0}>
        <section class="mb-8">
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              {t("home.recent")}
            </h2>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <For each={recent().slice(0, 3)}>{(tool) => <ToolCard id={tool.id} />}</For>
          </div>
        </section>
      </Show>

      <For each={categories}>
        {(category) => {
          const items = () => toolsInCategory(category);
          return (
            <Show when={items().length > 0}>
              <section class="mb-8">
                <div class="mb-2 flex items-center gap-2">
                  <h2 class="text-xs font-semibold uppercase tracking-[0.12em] text-faint">
                    {categoryLabel(category)}
                  </h2>
                  <span class="text-[11px] text-faint">{items().length}</span>
                </div>
                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <For each={items()}>{(tool) => <ToolCard id={tool.id} />}</For>
                </div>
              </section>
            </Show>
          );
        }}
      </For>

      <Card class="mt-2 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div class="flex items-center gap-2.5">
          <IconCommand class="size-4 text-faint" />
          <p class="text-xs text-muted">
            {t("home.keyboardPrefix")} <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd> <Kbd>K</Kbd>{" "}
            {t("home.keyboardSearch")} <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd> <Kbd>B</Kbd>{" "}
            {t("home.keyboardSidebar")}
          </p>
        </div>
      </Card>
    </div>
  );
}

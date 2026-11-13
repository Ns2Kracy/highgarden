import { useQuery } from "@tanstack/solid-query";
import { For, Show, createSignal } from "solid-js";
import { IconActivity, IconCpu, IconExternal, IconHardDrive, IconMemory, IconRefresh, IconShield } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Spinner,
  Switch,
} from "@/components/ui";
import { System } from "@/mygo";
import { formatBytes } from "@/lib/encoding";
import { t } from "@/lib/i18n";
import { systemInfo } from "@/lib/system";

function percent(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

function uptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return t("tools.system.uptimeDays", { days, hours });
  if (hours > 0) return t("tools.system.uptimeHours", { hours, minutes });
  return t("tools.system.uptimeMinutes", { minutes });
}

function Meter(props: { value: number; tone?: "accent" | "warning" }) {
  const width = () => `${Math.min(100, Math.max(0, props.value)).toFixed(1)}%`;
  return (
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        class={props.tone === "warning" ? "h-full rounded-full bg-warning" : "h-full rounded-full bg-accent"}
        style={{ width: width() }}
      />
    </div>
  );
}

export default function SystemTool() {
  const [live, setLive] = createSignal(true);
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));
  const overview = useQuery(() => ({
    queryKey: ["overview"],
    queryFn: System.overview,
    refetchInterval: live() ? 2000 : false,
    staleTime: 0,
  }));

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-muted">
          <Show when={overview.data}>
            {(data) => (
              <>
                <span class="font-medium text-fg">{data().hostname}</span>
                <span class="text-border-strong">/</span>
                <span>
                  {data().osName} {data().osVersion}
                </span>
                <span class="text-border-strong">/</span>
                <span>{t("tools.system.uptime", { duration: uptime(data().uptimeSeconds) })}</span>
              </>
            )}
          </Show>
          <Show when={!overview.data && overview.isPending}>
            <Spinner class="size-3.5" />
          </Show>
        </div>
        <div class="flex items-center gap-3">
          <Show when={info.data}>
            {(data) => (
              <Badge tone={data().elevated ? "success" : "neutral"}>
                <IconShield class="size-3" />
                {data().elevated ? t("common.administrator") : t("tools.system.standardUser")}
              </Badge>
            )}
          </Show>
          <label class="flex items-center gap-2 text-xs text-muted">
            <Switch
              checked={live()}
              onChange={setLive}
              label={t("tools.system.refreshLive")}
            />
            {t("tools.system.live")}
          </label>
          <Button size="sm" variant="ghost" onClick={() => void overview.refetch()} disabled={overview.isFetching}>
            <IconRefresh class={overview.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("common.refresh")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void System.openPage("taskmanager")}>
            <IconExternal class="size-3.5" />
            {t("tools.system.taskManager")}
          </Button>
        </div>
      </div>

      <Show
        when={overview.data}
        fallback={
          <div class="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            <Show
              when={overview.isError}
              fallback={
                <>
                  <Spinner /> {t("tools.system.reading")}
                </>
              }
            >
              <span>
                {t("tools.system.readError", {
                  message:
                    overview.error instanceof Error
                      ? overview.error.message
                      : t("error.unknown"),
                })}
              </span>
            </Show>
          </div>
        }
      >
        {(data) => (
          <div class="flex flex-col gap-4">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardBody class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs text-muted">
                    <span class="flex items-center gap-1.5">
                      <IconCpu class="size-3.5" /> {t("tools.system.cpu")}
                    </span>
                    <span class="font-mono text-fg">{data().cpuUsage.toFixed(0)}%</span>
                  </div>
                  <Meter value={data().cpuUsage} tone={data().cpuUsage > 85 ? "warning" : "accent"} />
                  <p class="truncate text-[11px] text-faint">{data().cpuName}</p>
                  <p class="text-[11px] text-faint">
                    {t("tools.system.logicalProcessors", { count: data().cpuCores })}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs text-muted">
                    <span class="flex items-center gap-1.5">
                      <IconMemory class="size-3.5" /> {t("tools.system.memory")}
                    </span>
                    <span class="font-mono text-fg">
                      {percent(data().memoryUsed, data().memoryTotal).toFixed(0)}%
                    </span>
                  </div>
                  <Meter value={percent(data().memoryUsed, data().memoryTotal)} tone={percent(data().memoryUsed, data().memoryTotal) > 90 ? "warning" : "accent"} />
                  <p class="text-[11px] text-faint">
                    {t("tools.system.memoryOf", {
                      used: formatBytes(data().memoryUsed),
                      total: formatBytes(data().memoryTotal),
                    })}
                  </p>
                  <Show when={data().swapTotal > 0}>
                    <p class="text-[11px] text-faint">
                      {t("tools.system.swap", {
                        used: formatBytes(data().swapUsed),
                        total: formatBytes(data().swapTotal),
                      })}
                    </p>
                  </Show>
                </CardBody>
              </Card>

              <Card>
                <CardBody class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs text-muted">
                    <span class="flex items-center gap-1.5">
                      <IconActivity class="size-3.5" /> {t("tools.system.processes")}
                    </span>
                    <span class="font-mono text-fg">{data().processCount}</span>
                  </div>
                  <p class="text-[11px] leading-relaxed text-faint">
                    {t("tools.system.processesNote")}
                  </p>
                </CardBody>
              </Card>

              <Card>
                <CardBody class="flex flex-col gap-2">
                  <div class="flex items-center justify-between text-xs text-muted">
                    <span class="flex items-center gap-1.5">
                      <IconHardDrive class="size-3.5" /> {t("tools.system.disks")}
                    </span>
                    <span class="font-mono text-fg">{data().disks.length}</span>
                  </div>
                  <For each={data().disks.slice(0, 3)}>
                    {(disk) => (
                      <div class="flex items-center gap-2 text-[11px]">
                        <span class="w-8 shrink-0 font-mono text-faint">{disk.mountPoint}</span>
                        <div class="flex-1">
                          <Meter value={percent(disk.total - disk.available, disk.total)} />
                        </div>
                        <span class="shrink-0 text-faint">
                          {t("tools.system.free", { size: formatBytes(disk.available) })}
                        </span>
                      </div>
                    )}
                  </For>
                </CardBody>
              </Card>
            </div>

            <div class="grid gap-3 lg:grid-cols-5">
              <Card class="lg:col-span-3">
                <CardHeader>
                  <CardTitle>{t("tools.system.topProcesses")}</CardTitle>
                  <Badge tone="neutral">{t("tools.system.byMemory")}</Badge>
                </CardHeader>
                <CardBody class="p-0">
                  <ul class="divide-y divide-border">
                    <For each={data().processes}>
                      {(process) => (
                        <li class="flex items-center gap-3 px-4 py-2 text-xs">
                          <span class="min-w-0 flex-1 truncate text-fg">{process.name}</span>
                          <span class="w-14 shrink-0 text-right font-mono text-faint">{process.pid}</span>
                          <span class="w-20 shrink-0 text-right font-mono text-muted">
                            {formatBytes(process.memory)}
                          </span>
                          <span class="w-12 shrink-0 text-right font-mono text-faint">
                            {process.cpu.toFixed(0)}%
                          </span>
                        </li>
                      )}
                    </For>
                  </ul>
                  <Show when={data().processes.length === 0}>
                    <p class="px-4 py-6 text-center text-xs text-faint">
                      {t("tools.system.noProcesses")}
                    </p>
                  </Show>
                </CardBody>
              </Card>

              <Card class="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{t("tools.system.storage")}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => void System.openPage("storage")}>
                    <IconExternal class="size-3.5" />
                    {t("tools.system.manage")}
                  </Button>
                </CardHeader>
                <CardBody class="flex flex-col gap-3">
                  <For each={data().disks}>
                    {(disk) => (
                      <div class="flex flex-col gap-1">
                        <div class="flex items-center justify-between text-xs">
                          <span class="truncate text-fg">
                            {disk.name || disk.mountPoint}
                            <Show when={disk.removable}>
                              <Badge tone="neutral" class="ml-2 px-1.5 py-0 text-[10px]">
                                {t("tools.system.removable")}
                              </Badge>
                            </Show>
                          </span>
                          <span class="shrink-0 font-mono text-[11px] text-faint">
                            {formatBytes(disk.total - disk.available)} / {formatBytes(disk.total)}
                          </span>
                        </div>
                        <Meter
                          value={percent(disk.total - disk.available, disk.total)}
                          tone={percent(disk.total - disk.available, disk.total) > 92 ? "warning" : "accent"}
                        />
                        <span class="text-[10px] text-faint">
                          {t("tools.system.diskMeta", {
                            mountPoint: disk.mountPoint,
                            filesystem: disk.fileSystem || t("tools.system.unknown"),
                            size: formatBytes(disk.available),
                          })}
                        </span>
                      </div>
                    )}
                  </For>
                  <Show when={data().batteryPercent >= 0}>
                    <div class="mt-1 flex items-center justify-between border-t border-border pt-3 text-xs">
                      <span class="text-muted">{t("tools.system.battery")}</span>
                      <span class="font-mono text-fg">
                        {data().batteryPercent}%{" "}
                        {data().batteryCharging ? t("tools.system.charging") : ""}
                      </span>
                    </div>
                  </Show>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
}

import { Dynamic } from "@solidjs/web";
import { useQuery } from "@tanstack/solid-query";
import { For, Show, createMemo, createSignal } from "solid-js";
import { IconBluetooth, IconExternal, IconKeyboard, IconMonitor, IconRefresh, IconUsb, IconWarning } from "@/components/icons";
import { Badge, Button, Card, CardBody, Field, Input, Spinner } from "@/components/ui";
import { System, type Device } from "@/mygo";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

function DeviceIcon(props: { device: Device }) {
  const icon = createMemo(() => {
    const cls = props.device.class.toLowerCase();
    if (cls.includes("keyboard")) return IconKeyboard;
    if (cls.includes("mouse") || cls.includes("hid")) return IconUsb;
    if (cls.includes("bluetooth")) return IconBluetooth;
    if (cls.includes("display") || cls.includes("monitor")) return IconMonitor;
    return IconUsb;
  });
  return <Dynamic component={icon()} class="size-4" />;
}

export default function DevicesTool() {
  const devices = useQuery(() => ({
    queryKey: ["devices"],
    queryFn: System.devices,
    staleTime: 30_000,
  }));

  const [query, setQuery] = createSignal("");
  const [deviceClass, setDeviceClass] = createSignal("all");
  const [problems, setProblems] = createSignal(false);

  const classes = createMemo(() => {
    const counts = new Map<string, number>();
    for (const device of devices.data ?? []) {
      const name = device.class || t("tools.devices.other");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  });

  const visible = createMemo(() => {
    const needle = query().trim().toLowerCase();
    return (devices.data ?? []).filter((device) => {
      const deviceClassOf = (value: Device) => value.class || t("tools.devices.other");
      if (deviceClass() !== "all" && deviceClassOf(device) !== deviceClass()) return false;
      if (problems() && device.errorCode === 0) return false;
      if (!needle) return true;
      return (
        device.name.toLowerCase().includes(needle) ||
        device.manufacturer.toLowerCase().includes(needle) ||
        device.class.toLowerCase().includes(needle) ||
        device.id.toLowerCase().includes(needle)
      );
    });
  });

  const problemCount = () => (devices.data ?? []).filter((device) => device.errorCode !== 0).length;

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field label={t("common.search")} class="min-w-56 flex-1">
          <Input
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("tools.devices.searchPlaceholder")}
            aria-label={t("tools.devices.searchLabel")}
          />
        </Field>
        <div class="flex items-center gap-2 pb-0.5">
          <Button variant="ghost" onClick={() => void devices.refetch()} disabled={devices.isFetching}>
            <IconRefresh class={devices.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("common.refresh")}
          </Button>
          <Button variant="ghost" onClick={() => void System.openPage("devices")}>
            <IconExternal class="size-3.5" />
            {t("tools.devices.deviceManager")}
          </Button>
          <Button variant="ghost" onClick={() => void System.openPage("bluetooth")}>
            <IconBluetooth class="size-3.5" />
            {t("tools.devices.bluetooth")}
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class={cn(
            "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            deviceClass() === "all"
              ? "border-accent/30 bg-accent-soft text-accent"
              : "border-border bg-surface text-muted hover:text-fg",
          )}
          onClick={() => setDeviceClass("all")}
        >
          {t("tools.devices.allDevices")}
          <span class="ml-1 text-faint">{devices.data?.length ?? 0}</span>
        </button>
        <For each={classes().slice(0, 12)}>
          {([name, count]) => (
            <button
              type="button"
              class={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                deviceClass() === name
                  ? "border-accent/30 bg-accent-soft text-accent"
                  : "border-border bg-surface text-muted hover:text-fg",
              )}
              onClick={() => setDeviceClass(deviceClass() === name ? "all" : name)}
            >
              {name}
              <span class="ml-1 text-faint">{count}</span>
            </button>
          )}
        </For>
        <button
          type="button"
          class={cn(
            "ml-auto rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
            problems()
              ? "border-warning/30 bg-warning/10 text-warning"
              : "border-border bg-surface text-muted hover:text-fg",
          )}
          onClick={() => setProblems((value) => !value)}
        >
          {t("tools.devices.problemsOnly")}
          <span class="ml-1 text-faint">{problemCount()}</span>
        </button>
      </div>

      <Show
        when={!devices.isError}
        fallback={
          <div class="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>
              {devices.error instanceof Error
                ? devices.error.message
                : t("tools.devices.readError")}
            </span>
          </div>
        }
      >
        <Card>
          <CardBody class="p-0">
            <Show
              when={!devices.isPending}
              fallback={
                <div class="flex items-center gap-2 px-4 py-8 text-sm text-muted">
                  <Spinner /> {t("tools.devices.reading")}
                </div>
              }
            >
              <ul class="divide-y divide-border">
                <For each={visible()}>
                  {(device) => (
                    <li class="flex items-center gap-3 px-4 py-2.5">
                      <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted">
                        <DeviceIcon device={device} />
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="truncate text-sm font-medium text-fg">{device.name}</span>
                          <Badge tone="neutral" class="px-1.5 py-0 text-[10px]">
                            {device.class || t("tools.devices.other")}
                          </Badge>
                          <Show when={device.errorCode !== 0}>
                            <Badge tone="warning" class="px-1.5 py-0 text-[10px]">
                              {t("tools.devices.problem", { code: device.errorCode })}
                            </Badge>
                          </Show>
                        </div>
                        <p class="truncate text-[11px] text-muted">
                          {device.manufacturer || t("tools.devices.unknownManufacturer")}
                          <Show when={device.driverVersion}>
                            <span class="text-faint">
                              {t("tools.devices.driver", { version: device.driverVersion })}
                            </span>
                          </Show>
                        </p>
                        <p class="truncate font-mono text-[10px] text-faint">{device.id}</p>
                      </div>
                      <Badge tone={device.errorCode === 0 ? "success" : "warning"} class="shrink-0">
                        {device.status ||
                          (device.errorCode === 0
                            ? t("tools.devices.ok")
                            : t("tools.devices.problemFallback"))}
                      </Badge>
                    </li>
                  )}
                </For>
              </ul>
              <Show when={visible().length === 0}>
                <p class="px-4 py-10 text-center text-sm text-muted">
                  {t("tools.devices.noMatch")}
                </p>
              </Show>
            </Show>
          </CardBody>
        </Card>
      </Show>

      <p class="text-[11px] leading-relaxed text-faint">
        {t("tools.devices.footer")}
      </p>
    </div>
  );
}

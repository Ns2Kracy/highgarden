import { useQuery } from "@tanstack/solid-query";
import { isMyGo } from "mygo-runtime";
import { Show, createSignal, onSettled } from "solid-js";
import { Badge } from "@/components/ui";
import { events } from "@/mygo";
import { systemInfo } from "@/lib/system";

const osNames: Record<string, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
};

/** The bottom bar: platform, native engine, version and clock. */
export function StatusBar() {
  const [clock, setClock] = createSignal(new Date().toLocaleTimeString());
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));

  onSettled(() => {
    if (!isMyGo()) return;
    return events.tick.on((time) => {
      setClock(new Date(time).toLocaleTimeString());
    });
  });

  return (
    <footer class="flex h-7 shrink-0 select-none items-center justify-between gap-3 border-t border-border bg-surface/60 px-3 text-[11px] text-faint">
      <div class="flex min-w-0 items-center gap-2">
        <Show when={info.data} fallback={<span>Connecting…</span>}>
          {(data) => (
            <>
              <span class="truncate">{osNames[data().os] ?? data().os}</span>
              <span class="text-border-strong">/</span>
              <span class="truncate">{data().arch}</span>
              <Show when={data().engine === "rust"}>
                <Badge tone="success" class="px-1.5 py-0 text-[10px]">
                  Rust native
                </Badge>
              </Show>
              <Show when={data().engine !== "rust"}>
                <Badge tone="warning" class="px-1.5 py-0 text-[10px]">
                  Go fallback
                </Badge>
              </Show>
              <Show when={data().elevated}>
                <Badge tone="accent" class="px-1.5 py-0 text-[10px]">
                  Admin
                </Badge>
              </Show>
            </>
          )}
        </Show>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <Show when={info.data}>{(data) => <span>v{data().appVersion}</span>}</Show>
        <span class="text-border-strong">/</span>
        <span class="tabular-nums">{clock()}</span>
      </div>
    </footer>
  );
}

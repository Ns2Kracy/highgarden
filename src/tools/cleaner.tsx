import { useQuery } from "@tanstack/solid-query";
import { For, Show, createEffect, createSignal } from "solid-js";
import { IconRefresh, IconShield, IconTrash, IconWarning } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Spinner,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { Cleaner, type CleanResult, type CleanTarget } from "@/mygo";
import { formatBytes } from "@/lib/encoding";
import { systemInfo } from "@/lib/system";

export default function CleanerTool() {
  const info = useQuery(() => ({ queryKey: ["system-info"], queryFn: systemInfo }));
  const scan = useQuery(() => ({
    queryKey: ["cleaner-scan"],
    queryFn: Cleaner.scan,
    staleTime: 0,
  }));

  const [selected, setSelected] = createSignal<string[]>([]);
  const [initialized, setInitialized] = createSignal(false);
  const [confirming, setConfirming] = createSignal(false);
  const [cleaning, setCleaning] = createSignal(false);
  const [result, setResult] = createSignal<CleanResult | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const elevated = () => info.data?.elevated ?? false;
  const targets = () => scan.data ?? [];
  const selectedTargets = () => targets().filter((target) => selected().includes(target.id));
  const selectedSize = () => selectedTargets().reduce((total, target) => total + target.size, 0);
  const totalSize = () =>
    targets()
      .filter((target) => target.available)
      .reduce((total, target) => total + target.size, 0);

  createEffect(
    () => scan.data,
    (data) => {
      if (!data || initialized()) return;
      setSelected(
        data
          .filter((target) => target.available && (!target.needsAdmin || elevated()))
          .map((target) => target.id),
      );
      setInitialized(true);
    },
  );

  const toggle = (target: CleanTarget) => {
    if (!target.available || (target.needsAdmin && !elevated())) return;
    setSelected((current) =>
      current.includes(target.id)
        ? current.filter((id) => id !== target.id)
        : [...current, target.id],
    );
  };

  const allSelected = () =>
    targets()
      .filter((target) => target.available && (!target.needsAdmin || elevated()))
      .every((target) => selected().includes(target.id));

  const toggleAll = () => {
    if (allSelected()) {
      setSelected([]);
    } else {
      setSelected(
        targets()
          .filter((target) => target.available && (!target.needsAdmin || elevated()))
          .map((target) => target.id),
      );
    }
  };

  const clean = async () => {
    setConfirming(false);
    setCleaning(true);
    setError(null);
    try {
      const cleaned = await Cleaner.clean(selected());
      setResult(cleaned);
      setSelected([]);
      await scan.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => void scan.refetch()} disabled={scan.isFetching || cleaning()}>
          <Show when={scan.isFetching} fallback={<IconRefresh class="size-3.5" />}>
            <Spinner class="size-3.5" />
          </Show>
          Scan again
        </Button>
        <Button variant="ghost" onClick={toggleAll} disabled={targets().length === 0 || cleaning()}>
          {allSelected() ? "Select none" : "Select all"}
        </Button>
        <span class="text-xs text-muted">
          {formatBytes(totalSize())} reclaimable · {formatBytes(selectedSize())} selected
        </span>
        <div class="ml-auto flex items-center gap-2">
          <Show when={!elevated()}>
            <Badge tone="warning">
              <IconShield class="size-3" />
              Some targets need administrator
            </Badge>
          </Show>
          <Button
            variant="danger"
            onClick={() => setConfirming(true)}
            disabled={selected().length === 0 || cleaning()}
          >
            <IconTrash class="size-3.5" />
            Clean selected
          </Button>
        </div>
      </div>

      <Show
        when={!scan.isError}
        fallback={
          <div class="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>
              {scan.error instanceof Error ? scan.error.message : "Could not scan for files."}
            </span>
          </div>
        }
      >
        <div class="grid gap-3 md:grid-cols-2">
          <For each={targets()}>
            {(target) => {
              const disabled = () => !target.available || (target.needsAdmin && !elevated());
              return (
                <label
                  class={cn(
                    "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
                    selected().includes(target.id)
                      ? "border-accent/40 bg-accent-soft/40"
                      : "border-border bg-surface hover:border-border-strong",
                    disabled() && "cursor-not-allowed opacity-55",
                  )}
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                    checked={selected().includes(target.id)}
                    disabled={disabled()}
                    onChange={() => toggle(target)}
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-2">
                      <span class="text-sm font-medium text-fg">{target.name}</span>
                      <span class="shrink-0 font-mono text-xs text-muted">
                        {target.available ? formatBytes(target.size) : "—"}
                      </span>
                    </div>
                    <p class="mt-0.5 text-[11px] leading-relaxed text-muted">{target.detail}</p>
                    <p class="mt-1 break-all font-mono text-[10px] text-faint">{target.path}</p>
                    <div class="mt-1.5 flex flex-wrap gap-1.5">
                      <Show when={!target.available}>
                        <Badge tone="neutral">Not found</Badge>
                      </Show>
                      <Show when={target.needsAdmin}>
                        <Badge tone={elevated() ? "success" : "warning"}>
                          <IconShield class="size-3" />
                          {elevated() ? "Administrator" : "Needs administrator"}
                        </Badge>
                      </Show>
                      <Show when={target.available && target.files > 0}>
                        <Badge tone="neutral">{target.files} files</Badge>
                      </Show>
                    </div>
                  </div>
                </label>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={targets().length === 0 && !scan.isFetching && !scan.isError}>
        <p class="py-8 text-center text-sm text-muted">Nothing to measure on this system.</p>
      </Show>

      <Show when={result()}>
        {(cleaned) => (
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <IconTrash class="size-4 text-success" />
                Cleaned {formatBytes(cleaned().freed)}
              </CardTitle>
              <Badge tone={cleaned().errors.length ? "warning" : "success"}>
                {cleaned().files} files removed
              </Badge>
            </CardHeader>
            <CardBody class="flex flex-col gap-2">
              <Show when={cleaned().skipped > 0}>
                <p class="text-xs text-muted">
                  {cleaned().skipped} entries were skipped because they are symbolic links or still in use.
                </p>
              </Show>
              <For each={cleaned().errors.slice(0, 6)}>
                {(message) => <p class="break-all font-mono text-[11px] text-warning">{message}</p>}
              </For>
              <Show when={cleaned().errors.length > 6}>
                <p class="text-xs text-faint">…and {cleaned().errors.length - 6} more.</p>
              </Show>
            </CardBody>
          </Card>
        )}
      </Show>

      <Show when={error()}>
        {(message) => (
          <div class="flex gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>{message()}</span>
          </div>
        )}
      </Show>

      <p class="text-[11px] leading-relaxed text-faint">
        The cleaner only touches the folders listed here, leaves the folders themselves, and
        never follows a symbolic link. Deletion is permanent.
      </p>

      <ConfirmDialog
        open={confirming()}
        title={`Delete ${formatBytes(selectedSize())}?`}
        description="These files are deleted permanently. Open files and symbolic links are skipped."
        confirmLabel="Delete files"
        danger
        busy={cleaning()}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void clean()}
      >
        <ul class="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          <For each={selectedTargets()}>
            {(target) => (
              <li class="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                <span class="truncate text-fg">{target.name}</span>
                <span class="shrink-0 font-mono text-faint">{formatBytes(target.size)}</span>
              </li>
            )}
          </For>
        </ul>
      </ConfirmDialog>
    </div>
  );
}

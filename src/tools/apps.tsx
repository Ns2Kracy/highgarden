import { useQuery } from "@tanstack/solid-query";
import { For, Show, createMemo, createSignal } from "solid-js";
import { IconExternal, IconPackage, IconRefresh, IconShield, IconTrash, IconWarning } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { Apps, System, type InstalledApp } from "@/mygo";
import { formatBytes } from "@/lib/encoding";
import { t } from "@/lib/i18n";

type Sort = "name" | "size" | "date";

export default function AppsTool() {
  const apps = useQuery(() => ({
    queryKey: ["installed-apps"],
    queryFn: Apps.list,
    staleTime: 60_000,
  }));

  const [query, setQuery] = createSignal("");
  const [sort, setSort] = createSignal<Sort>("name");
  const [scope, setScope] = createSignal("all");
  const [confirming, setConfirming] = createSignal<InstalledApp | null>(null);
  const [pending, setPending] = createSignal<string | null>(null);
  const [output, setOutput] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  const visible = createMemo(() => {
    const needle = query().trim().toLowerCase();
    const rows = (apps.data ?? []).filter((app) => {
      if (scope() !== "all" && app.scope !== scope()) return false;
      if (!needle) return true;
      return (
        app.name.toLowerCase().includes(needle) ||
        app.publisher.toLowerCase().includes(needle) ||
        app.installLocation.toLowerCase().includes(needle)
      );
    });
    const order = sort();
    return [...rows].sort((a, b) => {
      if (order === "size") return b.sizeBytes - a.sizeBytes;
      if (order === "date") return b.installDate.localeCompare(a.installDate);
      return a.name.localeCompare(b.name);
    });
  });

  const totalSize = () => visible().reduce((total, app) => total + app.sizeBytes, 0);
  const withSize = () => visible().filter((app) => app.sizeBytes > 0).length;

  const uninstall = async () => {
    const app = confirming();
    if (!app) return;
    setConfirming(null);
    setPending(app.id);
    setOutput(null);
    setError(null);
    try {
      const text = await Apps.uninstall(app.id);
      setOutput(text || t("tools.apps.noOutput"));
      await apps.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field label={t("common.search")} class="min-w-56 flex-1">
          <Input
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("tools.apps.searchPlaceholder")}
            aria-label={t("tools.apps.searchLabel")}
          />
        </Field>
        <Field label={t("tools.apps.scope")} class="w-36">
          <Select value={scope()} onChange={(event) => setScope(event.currentTarget.value)}>
            <option value="all">{t("tools.apps.allPrograms")}</option>
            <option value="machine">{t("tools.apps.forEveryone")}</option>
            <option value="user">{t("tools.apps.forMe")}</option>
          </Select>
        </Field>
        <Field label={t("tools.apps.sort")} class="w-36">
          <Select
            value={sort()}
            onChange={(event) => setSort(event.currentTarget.value as Sort)}
          >
            <option value="name">{t("tools.apps.byName")}</option>
            <option value="size">{t("tools.apps.bySize")}</option>
            <option value="date">{t("tools.apps.byDate")}</option>
          </Select>
        </Field>
        <div class="flex items-center gap-2 pb-0.5">
          <Button variant="ghost" onClick={() => void apps.refetch()} disabled={apps.isFetching}>
            <IconRefresh class={apps.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
            {t("common.refresh")}
          </Button>
          <Button variant="ghost" onClick={() => void System.openPage("apps")}>
            <IconExternal class="size-3.5" />
            {t("tools.apps.windowsApps")}
          </Button>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{t("tools.apps.programs", { count: visible().length })}</span>
        <span class="text-border-strong">/</span>
        <span>
          {t("tools.apps.totals", {
            size: formatBytes(totalSize()),
            count: withSize(),
          })}
        </span>
        <Badge tone="neutral" class="ml-auto">
          {t("tools.apps.ownUninstallers")}
        </Badge>
      </div>

      <Show
        when={!apps.isError}
        fallback={
          <div class="flex gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>
              {apps.error instanceof Error
                ? apps.error.message
                : t("tools.apps.readError")}
            </span>
          </div>
        }
      >
        <Card>
          <CardBody class="p-0">
            <Show
              when={!apps.isPending}
              fallback={
                <div class="flex items-center gap-2 px-4 py-8 text-sm text-muted">
                  <Spinner /> {t("tools.apps.reading")}
                </div>
              }
            >
              <ul class="divide-y divide-border">
                <For each={visible()}>
                  {(app) => (
                    <li class="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted">
                        <IconPackage class="size-4" />
                      </span>
                      <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="truncate text-sm font-medium text-fg">{app.name}</span>
                          <Show when={app.version}>
                            <span class="text-[11px] text-faint">{app.version}</span>
                          </Show>
                          <Show when={app.needsAdmin}>
                            <Badge tone="neutral" class="px-1.5 py-0 text-[10px]">
                              <IconShield class="size-3" />
                              {t("tools.apps.machine")}
                            </Badge>
                          </Show>
                        </div>
                        <p class="mt-0.5 truncate text-xs text-muted">
                          {app.publisher || t("tools.apps.unknownPublisher")}
                          <Show when={app.installLocation}>
                            <span class="text-faint"> · {app.installLocation}</span>
                          </Show>
                        </p>
                      </div>
                      <span class="w-20 shrink-0 text-right font-mono text-xs text-muted">
                        {app.sizeBytes > 0 ? formatBytes(app.sizeBytes) : "—"}
                      </span>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={!app.uninstallCommand || pending() === app.id}
                        title={app.uninstallCommand || t("tools.apps.noUninstall")}
                        onClick={() => setConfirming(app)}
                      >
                        <Show when={pending() === app.id} fallback={<IconTrash class="size-3.5" />}>
                          <Spinner class="size-3.5" />
                        </Show>
                        {t("tools.apps.uninstall")}
                      </Button>
                    </li>
                  )}
                </For>
              </ul>
              <Show when={visible().length === 0}>
                <p class="px-4 py-10 text-center text-sm text-muted">
                  {t("tools.apps.noMatch")}
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
            <span>{message()}</span>
          </div>
        )}
      </Show>

      <Show when={output()}>
        {(text) => (
          <Card>
            <CardHeader>
              <CardTitle>{t("tools.apps.uninstallerOutput")}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setOutput(null)}>
                {t("tools.apps.dismiss")}
              </Button>
            </CardHeader>
            <CardBody>
              <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-2 p-3 font-mono text-[11px] text-muted">
                {text()}
              </pre>
            </CardBody>
          </Card>
        )}
      </Show>

      <p class="text-[11px] leading-relaxed text-faint">
        {t("tools.apps.footer")}
      </p>

      <ConfirmDialog
        open={confirming() !== null}
        title={t("tools.apps.confirmTitle", { name: confirming()?.name ?? "" })}
        description={t("tools.apps.confirmBody")}
        confirmLabel={t("tools.apps.confirmLabel")}
        danger
        busy={pending() !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={() => void uninstall()}
      >
        <Show when={confirming()}>
          {(app) => (
            <div class="flex flex-col gap-2">
              <div class="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-xs">
                <span class="text-muted">{t("tools.apps.publisher")}</span>
                <span class="truncate text-fg">
                  {app().publisher || t("tools.apps.unknown")}
                </span>
                <span class="text-muted">{t("tools.apps.version")}</span>
                <span class="truncate text-fg">
                  {app().version || t("tools.apps.unknown")}
                </span>
                <span class="text-muted">{t("tools.apps.location")}</span>
                <span class="truncate font-mono text-[11px] text-fg">
                  {app().installLocation || t("tools.apps.notReported")}
                </span>
              </div>
              <div class="rounded-lg border border-border bg-surface-2 p-2.5">
                <p class="mb-1 text-[10px] uppercase tracking-wide text-faint">
                  {t("tools.apps.command")}
                </p>
                <p class="break-all font-mono text-[11px] text-fg">
                  {app().uninstallCommand || t("tools.apps.noCommand")}
                </p>
              </div>
            </div>
          )}
        </Show>
      </ConfirmDialog>
    </div>
  );
}

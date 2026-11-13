import { useParams } from "@tanstack/solid-router";
import { Dynamic } from "@solidjs/web";
import { Loading, Show, createEffect, createMemo, lazy } from "solid-js";
import { Badge, Spinner } from "@/components/ui";
import { t } from "@/lib/i18n";
import { recordRecent } from "@/lib/preferences";
import { toolSummary, toolTitle } from "@/framework/tool";
import { toolsById } from "@/tools";
import NotFoundPage from "./not-found";

/** Hosts the tool of the `$toolId` parameter, loading its module once. */
export default function ToolPage() {
  const params = useParams({ from: "/tools/$toolId" });
  const tool = createMemo(() => toolsById.get(params().toolId));

  const view = createMemo(() => {
    const current = tool();
    return current ? lazy(current.load) : undefined;
  });

  createEffect(
    () => params().toolId,
    (id) => {
      if (toolsById.has(id)) recordRecent(id);
    },
  );

  return (
    <Show when={tool()} keyed fallback={<NotFoundPage />}>
      {(current) => (
        <div class="mx-auto w-full max-w-5xl px-6 py-6" data-tool={current.id}>
          <header class="mb-5 flex items-start gap-3">
            <span class="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface text-muted shadow-app">
              <Dynamic component={current.icon} class="size-5" />
            </span>
            <div class="min-w-0 flex-1 pt-0.5">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-lg font-semibold tracking-tight">{toolTitle(current)}</h1>
                <Show when={current.native}>
                  <Badge tone="success" class="px-1.5 py-0 text-[10px]">
                    {t("common.rustNative")}
                  </Badge>
                </Show>
                <Show when={current.windows}>
                  <Badge tone="neutral" class="px-1.5 py-0 text-[10px]">
                    {t("common.windows")}
                  </Badge>
                </Show>
              </div>
              <p class="mt-0.5 text-sm leading-relaxed text-muted">{toolSummary(current)}</p>
            </div>
          </header>

          <Loading
            fallback={
              <div class="flex items-center gap-2 py-10 text-sm text-muted">
                <Spinner />
                {t("tool.loading", { title: toolTitle(current) })}
              </div>
            }
          >
            <Show when={view()} keyed>
              {(ToolView) => <ToolView />}
            </Show>
          </Loading>
        </div>
      )}
    </Show>
  );
}

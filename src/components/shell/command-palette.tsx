import { Dynamic } from "@solidjs/web";
import { useNavigate } from "@tanstack/solid-router";
import { For, Show, createMemo, createSignal, onSettled } from "solid-js";
import { IconArrowRight, IconSearch } from "@/components/icons";
import { Kbd } from "@/components/ui";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import { prefs } from "@/lib/preferences";
import { closeCommandPalette, commandOpen } from "@/lib/shell";
import { searchTools, toolSummary, toolTitle, type Tool } from "@/framework/tool";
import { tools, toolsById } from "@/tools";

/** The searchable list of every tool, opened with Ctrl/Cmd+K. */
export function CommandPalette() {
  return (
    <Show when={commandOpen()}>
      <PaletteDialog />
    </Show>
  );
}

function PaletteDialog() {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);
  let input: HTMLInputElement | undefined;

  const results = createMemo<Tool[]>(() => {
    const q = query().trim();
    if (q) return searchTools(tools, q);
    const recent = prefs()
      .recent.map((id) => toolsById.get(id))
      .filter((tool): tool is Tool => tool !== undefined);
    return [...recent, ...tools.filter((tool) => !prefs().recent.includes(tool.id))];
  });

  const current = () => Math.min(active(), Math.max(0, results().length - 1));

  onSettled(() => input?.focus());

  const choose = (tool: Tool) => {
    closeCommandPalette();
    navigate({ to: "/tools/$toolId", params: { toolId: tool.id } });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const count = results().length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(count === 0 ? 0 : (current() + 1) % count);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(count === 0 ? 0 : (current() - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const tool = results()[current()];
      if (tool) choose(tool);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeCommandPalette();
    }
  };

  return (
    <div
      class="animate-fade fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={closeCommandPalette}
    >
      <div
        class="animate-pop w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.label")}
      >
        <div class="flex items-center gap-2 border-b border-border px-3">
          <IconSearch class="size-4 text-faint" />
          <input
            ref={input}
            value={query()}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t("palette.placeholder")}
            aria-label={t("palette.label")}
            class="h-11 min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div class="max-h-80 overflow-y-auto p-1.5">
          <For each={results()}>
            {(tool, index) => (
              <button
                type="button"
                class={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  index() === current() ? "bg-accent-soft" : "hover:bg-surface-hover",
                )}
                onMouseEnter={() => setActive(index())}
                onClick={() => choose(tool)}
              >
                <span
                  class={cn(
                    "grid size-7 shrink-0 place-items-center rounded-md border",
                    index() === current()
                      ? "border-accent/25 bg-surface text-accent"
                      : "border-border bg-surface-2 text-muted",
                  )}
                >
                  <Dynamic component={tool.icon} class="size-4" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-center gap-2 text-[13px] font-medium text-fg">
                    {toolTitle(tool)}
                    <Show when={!query().trim() && prefs().recent.includes(tool.id)}>
                      <span class="text-[10px] font-normal text-faint">
                        {t("palette.recent")}
                      </span>
                    </Show>
                  </span>
                  <span class="block truncate text-xs text-muted">{toolSummary(tool)}</span>
                </span>
                <IconArrowRight
                  class={cn(
                    "size-3.5 shrink-0",
                    index() === current() ? "text-accent" : "text-transparent",
                  )}
                />
              </button>
            )}
          </For>
          <Show when={results().length === 0}>
            <p class="px-3 py-8 text-center text-sm text-muted">
              {t("palette.noMatch", { query: query() })}
            </p>
          </Show>
        </div>

        <div class="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-faint">
          <span>
            {results().length === 1
              ? t("palette.oneTool", { count: results().length })
              : t("palette.tools", { count: results().length })}
          </span>
          <span class="flex items-center gap-3">
            <span class="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              {t("palette.navigate")}
            </span>
            <span class="flex items-center gap-1">
              <Kbd>↵</Kbd>
              {t("palette.open")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

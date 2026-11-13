import { Link } from "@tanstack/solid-router";
import { Dynamic } from "@solidjs/web";
import { For, Show, createMemo, createSignal } from "solid-js";
import { IconSearch, IconSettings } from "@/components/icons";
import { Input } from "@/components/ui";
import { cn } from "@/lib/cn";
import { prefs, toggleSidebar } from "@/lib/preferences";
import { categories, searchTools, type Tool } from "@/framework/tool";
import { toolsInCategory } from "@/tools";

function ToolLink(props: { tool: Tool; collapsed: boolean }) {
  return (
    <Link
      to="/tools/$toolId"
      params={{ toolId: props.tool.id }}
      title={props.collapsed ? props.tool.title : undefined}
      class={cn(
        "group flex items-center gap-2.5 rounded-md py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-hover hover:text-fg",
        props.collapsed ? "justify-center px-0" : "px-2",
      )}
      activeProps={{
        class: "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
      }}
    >
      <Dynamic component={props.tool.icon} class="size-4" />
      <Show when={!props.collapsed}>
        <span class="truncate">{props.tool.title}</span>
        <Show when={props.tool.native}>
          <span class="ml-auto size-1.5 rounded-full bg-success" title="Uses the Rust module" />
        </Show>
      </Show>
    </Link>
  );
}

/** The tool list: filter, category groups, settings. */
export function Sidebar() {
  const [filter, setFilter] = createSignal("");
  const collapsed = () => prefs().sidebarCollapsed;

  const groups = createMemo(() =>
    categories
      .map((category) => ({
        ...category,
        tools: searchTools(toolsInCategory(category.id), filter()),
      }))
      .filter((group) => group.tools.length > 0),
  );

  return (
    <aside
      class={cn(
        "flex shrink-0 flex-col border-r border-border bg-surface/45 transition-[width] duration-150",
        collapsed() ? "w-13" : "w-60",
      )}
    >
      <Show when={!collapsed()}>
        <div class="px-3 pb-2 pt-3">
          <div class="relative">
            <IconSearch class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              value={filter()}
              onInput={(event) => setFilter(event.currentTarget.value)}
              placeholder="Filter tools"
              aria-label="Filter tools"
              class="h-8 pl-8 text-xs"
            />
          </div>
        </div>
      </Show>

      <nav class="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Tools">
        <For each={groups()}>
          {(group) => (
            <div class={collapsed() ? "mb-1" : "mb-3"}>
              <Show when={!collapsed()}>
                <p class="select-none px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                  {group.label}
                </p>
              </Show>
              <div class="flex flex-col gap-0.5">
                <For each={group.tools}>
                  {(tool) => <ToolLink tool={tool} collapsed={collapsed()} />}
                </For>
              </div>
            </div>
          )}
        </For>
        <Show when={groups().length === 0}>
          <p class="px-2 py-6 text-center text-xs text-faint">No tools match.</p>
        </Show>
      </nav>

      <div class="border-t border-border p-2">
        <Link
          to="/settings"
          title={collapsed() ? "Settings" : undefined}
          class={cn(
            "flex items-center gap-2.5 rounded-md py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-hover hover:text-fg",
            collapsed() ? "justify-center px-0" : "px-2",
          )}
          activeProps={{
            class: "bg-accent-soft text-accent hover:bg-accent-soft hover:text-accent",
          }}
        >
          <IconSettings class="size-4" />
          <Show when={!collapsed()}>
            <span class="flex-1">Settings</span>
          </Show>
        </Link>
        <Show when={!collapsed()}>
          <button
            type="button"
            class="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted transition-colors hover:bg-surface-hover hover:text-fg"
            onClick={toggleSidebar}
          >
            <span class="size-4" />
            <span>Hide sidebar</span>
          </button>
        </Show>
      </div>
    </aside>
  );
}

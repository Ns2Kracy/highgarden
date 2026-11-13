import type { Component } from "solid-js";
import type { IconProps } from "@/components/icons";
import { hasMessage, locale, t, type MessageKey } from "@/lib/i18n";

export type ToolCategory = "system" | "cleanup" | "apps" | "hardware" | "developer";

/** The category groups of the toolbox, in the order the sidebar shows them. */
export const categories: readonly ToolCategory[] = [
  "system",
  "cleanup",
  "apps",
  "hardware",
  "developer",
];

/** The name of a category in the current language. */
export function categoryLabel(category: ToolCategory): string {
  return t(`categories.${category}`);
}

/**
 * A tool of the toolbox: its metadata, and the module that renders it. The
 * module is imported the first time the tool opens, so the initial page
 * stays small.
 *
 * `title` and `summary` are what the catalog in `src/lib/i18n` does not know
 * yet: the language files name a tool as `tools.<id>.title`, and these are
 * the fallback when they do not. Keep them in English.
 */
export type Tool = {
  id: string;
  title: string;
  summary: string;
  category: ToolCategory;
  keywords?: string[];
  icon: Component<IconProps>;
  /** Set when the tool calls the Rust native module. */
  native?: boolean;
  /** Set when the tool only works on Windows. */
  windows?: boolean;
  load: () => Promise<{ default: Component }>;
};

/** Declares a tool, keeping its metadata checked. */
export function defineTool(tool: Tool): Tool {
  return tool;
}

export function toolHref(id: string): string {
  return `/tools/${id}`;
}

/**
 * The name of a tool in the current language. Translation keys are derived
 * from the id, so a tool added to the registry works before it is translated.
 */
export function toolTitle(tool: Tool): string {
  const key = `tools.${tool.id}.title`;
  return hasMessage(key) ? t(key as MessageKey) : tool.title;
}

/** The one-line description of a tool in the current language. */
export function toolSummary(tool: Tool): string {
  const key = `tools.${tool.id}.summary`;
  return hasMessage(key) ? t(key as MessageKey) : tool.summary;
}

function score(tool: Tool, query: string): number {
  const title = toolTitle(tool).toLowerCase();
  const summary = toolSummary(tool).toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 12;
    else if (title.includes(term)) total += 8;
    else if (tool.id.includes(term)) total += 6;
    else if (tool.keywords?.some((k) => k.toLowerCase().includes(term))) total += 4;
    else if (summary.includes(term)) total += 2;
    else return 0;
  }
  return total;
}

/** The tools matching every term of the query, best first. */
export function searchTools(tools: Tool[], query: string): Tool[] {
  const trimmed = query.trim();
  if (!trimmed) return tools;
  return tools
    .map((tool) => ({ tool, score: score(tool, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || toolTitle(a.tool).localeCompare(toolTitle(b.tool), locale()),
    )
    .map((entry) => entry.tool);
}

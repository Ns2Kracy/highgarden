import type { Component } from "solid-js";
import type { IconProps } from "@/components/icons";

export type ToolCategory = "system" | "cleanup" | "apps" | "hardware" | "developer";

export const categories: { id: ToolCategory; label: string }[] = [
  { id: "system", label: "System" },
  { id: "cleanup", label: "Cleanup" },
  { id: "apps", label: "Apps" },
  { id: "hardware", label: "Hardware" },
  { id: "developer", label: "Developer" },
];

/**
 * A tool of the toolbox: its metadata, and the module that renders it. The
 * module is imported the first time the tool opens, so the initial page
 * stays small.
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

function score(tool: Tool, query: string): number {
  const title = tool.title.toLowerCase();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const term of terms) {
    if (title.startsWith(term)) total += 12;
    else if (title.includes(term)) total += 8;
    else if (tool.id.includes(term)) total += 6;
    else if (tool.keywords?.some((k) => k.toLowerCase().includes(term))) total += 4;
    else if (tool.summary.toLowerCase().includes(term)) total += 2;
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
    .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
    .map((entry) => entry.tool);
}

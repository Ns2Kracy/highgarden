import type { JSX } from "@solidjs/web";
import { cn } from "@/lib/cn";

/** A quiet placeholder for an empty list or panel. */
export function EmptyState(props: {
  icon?: JSX.Element;
  title: string;
  description?: string;
  action?: JSX.Element;
  class?: string;
}) {
  return (
    <div
      class={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center",
        props.class,
      )}
    >
      {props.icon && <div class="text-faint">{props.icon}</div>}
      <p class="text-sm font-medium text-fg">{props.title}</p>
      {props.description && (
        <p class="max-w-sm text-xs leading-relaxed text-muted">{props.description}</p>
      )}
      {props.action}
    </div>
  );
}

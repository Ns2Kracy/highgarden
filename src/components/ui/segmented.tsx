import type { JSX } from "@solidjs/web";
import { For } from "solid-js";
import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: (props: { class?: string }) => JSX.Element;
};

export type SegmentedProps<T extends string> = {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  class?: string;
  ariaLabel?: string;
};

/** A row of mutually exclusive buttons, for small modes. */
export function Segmented<T extends string>(props: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props.ariaLabel}
      class={cn("inline-flex rounded-lg border border-border bg-surface-2 p-0.5", props.class)}
    >
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.value === option.value ? "true" : "false"}
            class={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              props.value === option.value
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg",
            )}
            onClick={() => props.onChange(option.value)}
          >
            {option.icon?.({ class: "size-3.5" })}
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}

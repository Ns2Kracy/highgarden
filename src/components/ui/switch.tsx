import { cn } from "@/lib/cn";

/** A small toggle for boolean options. */
export function Switch(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  class?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked ? "true" : "false"}
      aria-label={props.label}
      class={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors",
        props.checked ? "border-accent bg-accent" : "border-border-strong bg-surface-2",
        props.class,
      )}
      onClick={() => props.onChange(!props.checked)}
    >
      <span
        class={cn(
          "absolute top-0.5 size-3.5 rounded-full bg-white shadow-sm transition-all",
          props.checked ? "left-4.5" : "left-0.5",
        )}
      />
    </button>
  );
}

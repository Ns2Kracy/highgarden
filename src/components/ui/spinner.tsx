import { cn } from "@/lib/cn";

/** A small spinning indicator. */
export function Spinner(props: { class?: string }) {
  return (
    <svg
      class={cn("size-4 animate-spin text-muted", props.class)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity=".2" stroke-width="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  );
}

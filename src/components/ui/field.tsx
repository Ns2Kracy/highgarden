import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { cn } from "@/lib/cn";

export type FieldProps = {
  label?: string;
  hint?: string;
  error?: string | null;
  class?: string;
  children: JSX.Element;
};

/** A labeled control, with a hint or an error below it. */
export function Field(props: FieldProps) {
  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      <Show when={props.label}>
        {(label) => <span class="select-none text-xs font-medium text-muted">{label()}</span>}
      </Show>
      {props.children}
      <Show when={props.error ? props.error : props.hint}>
        {(text) => (
          <span class={cn("text-xs", props.error ? "text-danger" : "text-faint")}>{text()}</span>
        )}
      </Show>
    </div>
  );
}

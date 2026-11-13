import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-2 text-muted",
  accent: "border-accent/20 bg-accent-soft text-accent",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
};

export function Badge(props: JSX.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const rest = omit(props, "tone", "class");
  return (
    <span
      class={cn(
        "inline-flex select-none items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[props.tone ?? "neutral"],
        props.class as string,
      )}
      {...rest}
    />
  );
}

export function Kbd(props: JSX.HTMLAttributes<HTMLElement>) {
  const rest = omit(props, "class");
  return (
    <kbd
      class={cn(
        "inline-flex h-5 min-w-5 select-none items-center justify-center rounded border border-border bg-surface-2 px-1 font-sans text-[10px] font-medium text-muted",
        props.class as string,
      )}
      {...rest}
    />
  );
}

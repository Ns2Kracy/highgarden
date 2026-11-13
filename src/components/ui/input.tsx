import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-lg border border-border bg-surface text-fg placeholder:text-faint transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50";

/** A single-line input styled for the app. */
export function Input(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const rest = omit(props, "class");
  return <input class={cn(base, "h-9 px-3 text-sm", props.class as string)} {...rest} />;
}

/** A multi-line input; monospace is the default for tool content. */
export function Textarea(props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const rest = omit(props, "class");
  return (
    <textarea
      spellcheck="false"
      class={cn(
        base,
        "min-h-32 resize-y px-3 py-2 font-mono text-[13px] leading-relaxed",
        props.class as string,
      )}
      {...rest}
    />
  );
}

/** A native select dressed like the inputs. */
export function Select(props: JSX.SelectHTMLAttributes<HTMLSelectElement>) {
  const rest = omit(props, "class");
  return (
    <select
      class={cn(base, "h-9 cursor-pointer px-2.5 pr-8 text-sm", props.class as string)}
      {...rest}
    />
  );
}

import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cn } from "@/lib/cn";

/** A panel of content. */
export function Card(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const rest = omit(props, "class");
  return (
    <div
      class={cn("rounded-xl border border-border bg-surface shadow-app", props.class as string)}
      {...rest}
    />
  );
}

export function CardHeader(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const rest = omit(props, "class");
  return (
    <div
      class={cn(
        "flex items-start justify-between gap-3 border-b border-border px-4 py-3",
        props.class as string,
      )}
      {...rest}
    />
  );
}

export function CardTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
  const rest = omit(props, "class");
  return <h2 class={cn("text-sm font-semibold text-fg", props.class as string)} {...rest} />;
}

export function CardBody(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const rest = omit(props, "class");
  return <div class={cn("p-4", props.class as string)} {...rest} />;
}

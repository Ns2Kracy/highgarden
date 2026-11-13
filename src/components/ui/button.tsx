import type { JSX } from "@solidjs/web";
import { omit } from "solid-js";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg shadow-sm hover:brightness-110 active:brightness-95",
  secondary:
    "border border-border bg-surface text-fg shadow-sm hover:border-border-strong hover:bg-surface-hover",
  ghost: "text-muted hover:bg-surface-hover hover:text-fg",
  danger:
    "border border-danger/25 bg-danger/10 text-danger hover:border-danger/40 hover:bg-danger/15",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-7 gap-1.5 rounded-md px-2 text-xs",
  md: "h-9 gap-2 rounded-lg px-3 text-sm",
  icon: "size-8 rounded-md",
};

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** A button with the app's variants and sizes. */
export function Button(props: ButtonProps) {
  const rest = omit(props, "variant", "size", "class");
  return (
    <button
      type="button"
      class={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-45",
        variants[props.variant ?? "secondary"],
        sizes[props.size ?? "md"],
        props.class as string,
      )}
      {...rest}
    />
  );
}

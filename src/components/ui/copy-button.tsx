import { Show, createSignal, onSettled } from "solid-js";
import { IconCheck, IconCopy } from "@/components/icons";
import { cn } from "@/lib/cn";
import { Button, type ButtonSize } from "./button";

/** Copies a value and confirms it for a moment. */
export function CopyButton(props: {
  value: string;
  label?: string;
  size?: ButtonSize;
  class?: string;
}) {
  const [copied, setCopied] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.value);
      setCopied(true);
      clearTimeout(timer);
      timer = setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.warn("Could not copy:", err);
    }
  };

  onSettled(() => () => clearTimeout(timer));

  return (
    <Button
      variant="ghost"
      size={props.size ?? "sm"}
      class={cn("text-muted hover:text-fg", props.class)}
      aria-label={copied() ? "Copied" : (props.label ?? "Copy")}
      title={copied() ? "Copied" : (props.label ?? "Copy")}
      onClick={() => void copy()}
    >
      <Show when={copied()} fallback={<IconCopy class="size-3.5" />}>
        <IconCheck class="size-3.5 text-success" />
      </Show>
      <Show when={props.size !== "icon"}>
        <span>{copied() ? "Copied" : "Copy"}</span>
      </Show>
    </Button>
  );
}

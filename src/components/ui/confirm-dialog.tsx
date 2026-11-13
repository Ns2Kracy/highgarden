import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { t } from "@/lib/i18n";
import { Button } from "./button";
import { Spinner } from "./spinner";

/** A modal that asks before something irreversible. */
export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  busy?: boolean;
  danger?: boolean;
  children?: JSX.Element;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Show when={props.open}>
      <div
        class="animate-fade fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-[2px]"
        onClick={() => {
          if (!props.busy) props.onCancel();
        }}
      >
        <div
          class="animate-pop flex w-full max-w-lg flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-pop"
          role="dialog"
          aria-modal="true"
          aria-label={props.title}
          onClick={(event) => event.stopPropagation()}
        >
          <div>
            <h2 class="text-base font-semibold text-fg">{props.title}</h2>
            <Show when={props.description}>
              {(description) => (
                <p class="mt-1 text-sm leading-relaxed text-muted">{description()}</p>
              )}
            </Show>
          </div>
          {props.children}
          <div class="mt-1 flex justify-end gap-2">
            <Button variant="ghost" onClick={props.onCancel} disabled={props.busy}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={props.danger ? "danger" : "primary"}
              onClick={props.onConfirm}
              disabled={props.busy}
            >
              <Show when={props.busy}>
                <Spinner class="size-3.5" />
              </Show>
              {props.confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Show>
  );
}

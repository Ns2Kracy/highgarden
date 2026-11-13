import { createMemo } from "solid-js";
import { IconWarning } from "@/components/icons";
import { Button } from "@/components/ui";
import { t } from "@/lib/i18n";

export default function ErrorPage(props: { error: unknown; reset?: () => void }) {
  const message = createMemo(() =>
    props.error instanceof Error
      ? props.error.message
      : String(props.error ?? t("error.unknown")),
  );

  return (
    <div class="mx-auto flex w-full max-w-lg flex-col items-start gap-3 px-6 py-16">
      <span class="grid size-10 place-items-center rounded-xl border border-danger/25 bg-danger/10 text-danger">
        <IconWarning class="size-5" />
      </span>
      <h1 class="text-xl font-semibold tracking-tight">{t("error.title")}</h1>
      <p class="break-words text-sm leading-relaxed text-muted">{message()}</p>
      <Button
        class="mt-1"
        variant="secondary"
        onClick={() => {
          if (props.reset) props.reset();
          else location.reload();
        }}
      >
        {t("error.retry")}
      </Button>
    </div>
  );
}

import { Link } from "@tanstack/solid-router";
import { IconArrowRight } from "@/components/icons";
import { t } from "@/lib/i18n";

export default function NotFoundPage() {
  return (
    <div class="mx-auto flex w-full max-w-md flex-col items-start gap-3 px-6 py-16">
      <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">
        {t("notFound.code")}
      </p>
      <h1 class="text-xl font-semibold tracking-tight">{t("notFound.title")}</h1>
      <p class="text-sm leading-relaxed text-muted">{t("notFound.body")}</p>
      <Link
        to="/"
        class="mt-1 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg shadow-sm transition-colors hover:border-border-strong hover:bg-surface-hover"
      >
        {t("notFound.back")}
        <IconArrowRight class="size-3.5" />
      </Link>
    </div>
  );
}

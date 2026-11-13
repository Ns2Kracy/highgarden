import { Show, createSignal } from "solid-js";
import { IconRefresh, IconWarning } from "@/components/icons";
import { Badge, Button, CopyButton, Field, Segmented, Switch, Textarea } from "@/components/ui";
import { decodeBase64, encodeBase64, formatBytes } from "@/lib/encoding";
import { t } from "@/lib/i18n";

type Mode = "encode" | "decode";

const sample = "Highgarden: one window, many small tools.";

export default function Base64Tool() {
  const [mode, setMode] = createSignal<Mode>("encode");
  const [urlSafe, setUrlSafe] = createSignal(false);
  const [input, setInput] = createSignal(sample);
  const [output, setOutput] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const run = () => {
    try {
      const value =
        mode() === "encode" ? encodeBase64(input(), urlSafe()) : decodeBase64(input(), urlSafe());
      setOutput(value);
      setError(null);
    } catch (err) {
      setOutput("");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const swap = () => {
    if (!output()) return;
    setInput(output());
    setOutput("");
    setError(null);
    setMode((current) => (current === "encode" ? "decode" : "encode"));
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field label={t("tools.base64.mode")}>
          <Segmented
            ariaLabel={t("tools.base64.mode")}
            value={mode()}
            options={[
              { value: "encode", label: t("tools.base64.encode") },
              { value: "decode", label: t("tools.base64.decode") },
            ]}
            onChange={setMode}
          />
        </Field>
        <Field label={t("tools.base64.alphabet")}>
          <div class="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-surface px-3">
            <Switch
              checked={urlSafe()}
              onChange={setUrlSafe}
              label={t("tools.base64.urlSafeLabel")}
            />
            <span class="text-xs text-muted">{t("tools.base64.urlSafe")}</span>
          </div>
        </Field>
        <div class="ml-auto flex gap-2">
          <Button variant="primary" onClick={run}>
            {mode() === "encode" ? t("tools.base64.encode") : t("tools.base64.decode")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t("tools.base64.swapTitle")}
            aria-label={t("tools.base64.swapTitle")}
            disabled={!output()}
            onClick={swap}
          >
            <IconRefresh />
          </Button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <Field
          label={mode() === "encode" ? t("tools.base64.text") : t("tools.base64.base64")}
          hint={t("tools.base64.bytesOfUtf8", {
            size: formatBytes(new TextEncoder().encode(input()).length),
          })}
        >
          <Textarea
            value={input()}
            onInput={(event) => setInput(event.currentTarget.value)}
            placeholder={
              mode() === "encode"
                ? t("tools.base64.textPlaceholder")
                : t("tools.base64.base64Placeholder")
            }
            class="h-64"
            aria-label={t("tools.base64.inputLabel")}
          />
        </Field>
        <Field
          label={mode() === "encode" ? t("tools.base64.base64") : t("tools.base64.text")}
          hint={
            output()
              ? t("tools.base64.characters", { count: output().length })
              : t("tools.base64.runHint")
          }
        >
          <div class="relative">
            <Textarea
              value={output()}
              readonly
              placeholder={t("tools.base64.outputPlaceholder")}
              class="h-64 bg-surface-2 pr-10"
              aria-label={t("tools.base64.outputLabel")}
            />
            <div class="absolute right-1.5 top-1.5">
              <CopyButton value={output()} size="icon" />
            </div>
          </div>
        </Field>
      </div>

      <div class="flex items-center gap-2">
        <Badge tone="neutral">UTF-8</Badge>
        <Badge tone="neutral">{urlSafe() ? "Base64URL" : "Base64"}</Badge>
        <span class="text-xs text-faint">
          {t("tools.base64.note")}
        </span>
      </div>

      <Show when={error()}>
        {(message) => (
          <div class="flex gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span>{message()}</span>
          </div>
        )}
      </Show>
    </div>
  );
}

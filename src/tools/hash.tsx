import { useQuery } from "@tanstack/solid-query";
import { isMyGo } from "mygo-runtime";
import { Show, createSignal } from "solid-js";
import { IconFolderOpen, IconHash, IconWarning } from "@/components/icons";
import {
  Badge,
  Button,
  CopyButton,
  Field,
  Segmented,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { Digest, Files } from "@/mygo";
import { t, type MessageKey } from "@/lib/i18n";

type Source = "text" | "file";
type Algorithm = "sha256" | "sha512" | "blake3";

const algorithmNotes: Record<Algorithm, MessageKey> = {
  sha256: "tools.hash.noteSha256",
  sha512: "tools.hash.noteSha512",
  blake3: "tools.hash.noteBlake3",
};

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export default function HashTool() {
  const available = useQuery(() => ({
    queryKey: ["digest-available"],
    queryFn: () => (isMyGo() ? Digest.available() : Promise.resolve(false)),
  }));

  const [source, setSource] = createSignal<Source>("text");
  const [algorithm, setAlgorithm] = createSignal<Algorithm>("sha256");
  const [text, setText] = createSignal("Highgarden");
  const [path, setPath] = createSignal("");
  const [digest, setDigest] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const pick = async () => {
    setBusy(true);
    setError(null);
    try {
      const chosen = await Files.pick();
      if (!chosen) return;
      setPath(chosen);
      setDigest("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const value =
        source() === "text"
          ? await Digest.text(algorithm(), text())
          : await Digest.file(algorithm(), path());
      setDigest(value);
    } catch (err) {
      setDigest("");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const ready = () => source() === "text" || path() !== "";

  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Field label={t("tools.hash.source")}>
          <Segmented
            ariaLabel={t("tools.hash.source")}
            value={source()}
            options={[
              { value: "text", label: t("tools.hash.text") },
              { value: "file", label: t("tools.hash.file") },
            ]}
            onChange={(next) => {
              setSource(next);
              setDigest("");
              setError(null);
            }}
          />
        </Field>

        <Field
          label={t("tools.hash.algorithm")}
          hint={t(algorithmNotes[algorithm()])}
          class="w-56"
        >
          <Select
            value={algorithm()}
            onChange={(event) => {
              setAlgorithm(event.currentTarget.value as Algorithm);
              setDigest("");
            }}
          >
            <option value="sha256">SHA-256</option>
            <option value="sha512">SHA-512</option>
            <option value="blake3">BLAKE3</option>
          </Select>
        </Field>

        <div class="ml-auto flex items-center gap-2">
          <Badge tone={available.data ? "success" : "warning"}>
            {available.data ? t("common.rustNative") : t("common.goFallback")}
          </Badge>
          <Button variant="primary" onClick={() => void run()} disabled={busy() || !ready()}>
            <Show when={busy()} fallback={<IconHash class="size-3.5" />}>
              <Spinner class="size-3.5" />
            </Show>
            {t("tools.hash.hash")}
          </Button>
        </div>
      </div>

      <Show when={source() === "text"}>
        <Field label={t("tools.hash.textLabel")} hint={t("tools.hash.textHint")}>
          <Textarea
            value={text()}
            onInput={(event) => setText(event.currentTarget.value)}
            placeholder={t("tools.hash.textPlaceholder")}
            class="h-40"
            aria-label={t("tools.hash.textLabelLong")}
          />
        </Field>
      </Show>

      <Show when={source() === "file"}>
        <div class="flex flex-wrap items-center gap-2">
          <Button onClick={() => void pick()} disabled={busy()}>
            <IconFolderOpen class="size-3.5" />
            {t("tools.hash.chooseFile")}
          </Button>
          <Show
            when={path()}
            fallback={<span class="text-xs text-faint">{t("tools.hash.noFile")}</span>}
          >
            {(file) => (
              <div class="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5">
                <span class="truncate text-xs text-fg">{fileName(file())}</span>
                <span class="max-w-64 truncate font-mono text-[10px] text-faint">{file()}</span>
              </div>
            )}
          </Show>
        </div>
        <p class="text-xs leading-relaxed text-muted">{t("tools.hash.fileNote")}</p>
      </Show>

      <Show when={digest()}>
        {(value) => (
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-muted">
                {t("tools.hash.digestMeta", {
                  algorithm: algorithm().toUpperCase(),
                  bytes: value().length / 2,
                })}
              </span>
              <CopyButton value={value()} />
            </div>
            <div class="break-all rounded-lg border border-border bg-surface-2 px-3 py-2.5 font-mono text-xs leading-relaxed text-fg">
              {value()}
            </div>
          </div>
        )}
      </Show>

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

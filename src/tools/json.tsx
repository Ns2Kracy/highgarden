import { Show, createMemo, createSignal } from "solid-js";
import { IconCheck, IconFolderOpen, IconRefresh, IconTrash, IconWarning } from "@/components/icons";
import { Badge, Button, CopyButton, Field, Select, Textarea } from "@/components/ui";
import { Files } from "@/mygo";
import { formatBytes } from "@/lib/encoding";
import { t } from "@/lib/i18n";

const sample = `{
  "name": "highgarden",
  "stack": ["go", "solid", "rust"],
  "native": { "module": "hasher", "algorithms": 3 },
  "ready": true
}`;

type Indent = "2" | "4" | "tab";

function describeError(err: unknown, text: string): string {
  const message = err instanceof Error ? err.message : String(err);
  const position = /position (\d+)/.exec(message);
  if (!position) return message;
  const index = Math.min(Number(position[1]), text.length);
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const column = index - before.lastIndexOf("\n");
  return t("tools.json.errorPosition", { message, line, column });
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}

export default function JsonTool() {
  const [input, setInput] = createSignal(sample);
  const [output, setOutput] = createSignal("");
  const [indent, setIndent] = createSignal<Indent>("2");
  const [error, setError] = createSignal<string | null>(null);
  const [notice, setNotice] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const gap = () => (indent() === "tab" ? "\t" : Number(indent()));
  const validity = createMemo(() => {
    try {
      JSON.parse(input());
      return null;
    } catch (err) {
      return describeError(err, input());
    }
  });

  const transform = (fn: (value: unknown) => string) => {
    setNotice(null);
    try {
      const value: unknown = JSON.parse(input());
      setOutput(fn(value));
      setError(null);
    } catch (err) {
      setOutput("");
      setError(describeError(err, input()));
    }
  };

  const format = () => {
    const space = gap();
    transform((value) => JSON.stringify(value, null, space));
  };
  const minify = () => transform((value) => JSON.stringify(value));
  const sort = () => {
    const space = gap();
    transform((value) => JSON.stringify(sortValue(value), null, space));
  };

  const open = async () => {
    setBusy(true);
    setError(null);
    try {
      const path = await Files.pick();
      if (!path) return;
      const text = await Files.readText(path);
      setInput(text);
      setNotice(path);
      try {
        setOutput(JSON.stringify(JSON.parse(text), null, gap()));
        setError(null);
      } catch (err) {
        setError(describeError(err, text));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const path = await Files.saveText("data.json", output() || input());
      if (path) setNotice(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={format}>
          {t("tools.json.format")}
        </Button>
        <Button onClick={minify}>{t("tools.json.minify")}</Button>
        <Button onClick={sort}>{t("tools.json.sortKeys")}</Button>
        <div class="mx-1 h-5 w-px bg-border" />
        <Field class="w-28">
          <Select
            aria-label={t("tools.json.indentation")}
            value={indent()}
            onChange={(event) => setIndent(event.currentTarget.value as Indent)}
          >
            <option value="2">{t("tools.json.twoSpaces")}</option>
            <option value="4">{t("tools.json.fourSpaces")}</option>
            <option value="tab">{t("tools.json.tab")}</option>
          </Select>
        </Field>
        <div class="ml-auto flex items-center gap-2">
          <Button size="sm" onClick={() => void open()} disabled={busy()}>
            <IconFolderOpen class="size-3.5" />
            {t("tools.json.open")}
          </Button>
          <Button size="sm" onClick={() => void save()} disabled={busy()}>
            {t("tools.json.save")}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title={t("tools.json.clear")}
            aria-label={t("tools.json.clear")}
            onClick={() => {
              setInput("");
              setOutput("");
              setError(null);
              setNotice(null);
            }}
          >
            <IconTrash />
          </Button>
        </div>
      </div>

      <div class="grid gap-3 lg:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <div class="flex h-6 items-center justify-between text-xs text-muted">
            <span class="font-medium">{t("tools.json.input")}</span>
            <Show
              when={validity()}
              fallback={
                <span class="inline-flex items-center gap-1 text-success">
                  <IconCheck class="size-3.5" />
                  {t("tools.json.valid")}
                </span>
              }
            >
              <span class="inline-flex items-center gap-1 text-danger">
                <IconWarning class="size-3.5" />
                {t("tools.json.invalid")}
              </span>
            </Show>
          </div>
          <Textarea
            value={input()}
            onInput={(event) => setInput(event.currentTarget.value)}
            onBlur={() => format()}
            placeholder={t("tools.json.inputPlaceholder")}
            class="h-[26rem]"
            aria-label={t("tools.json.inputLabel")}
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex h-6 items-center justify-between text-xs text-muted">
            <span class="font-medium">{t("tools.json.output")}</span>
            <div class="flex items-center gap-1">
              <Show when={output()}>
                <span>{formatBytes(new TextEncoder().encode(output()).length)}</span>
              </Show>
              <CopyButton value={output()} size="icon" />
            </div>
          </div>
          <Textarea
            value={output()}
            readonly
            placeholder={t("tools.json.outputPlaceholder")}
            class="h-[26rem] bg-surface-2"
            aria-label={t("tools.json.outputLabel")}
          />
        </div>
      </div>

      <Show when={error()}>
        {(message) => (
          <div class="flex gap-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs leading-relaxed text-danger">
            <IconWarning class="mt-0.5 size-3.5 shrink-0" />
            <span class="break-words">{message()}</span>
          </div>
        )}
      </Show>
      <Show when={notice()}>
        {(path) => (
          <div class="flex items-center gap-2 text-xs text-muted">
            <IconRefresh class="size-3.5" />
            <span class="truncate font-mono text-[11px]">{path()}</span>
            <Badge tone="success">{t("tools.json.loaded")}</Badge>
          </div>
        )}
      </Show>
    </div>
  );
}

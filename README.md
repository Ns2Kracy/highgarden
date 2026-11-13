# Highgarden

A local-first system toolbox for Windows. One window for the maintenance jobs
you would otherwise hunt through Settings for — plus a few developer utilities
in the same place.

- **Shell, services and safety checks** — [MyGo](https://mygo.dev): Go owns the
  window, the registry, the filesystem, dialogs and persisted settings.
- **Interface** — Solid 2 and Vite, styled with **Tailwind CSS 4** and a small
  design system of semantic tokens.
- **Native** — Rust modules:
  - `modules/sysprobe` reads CPU, memory, disks, processes and Plug and Play
    devices (through `sysinfo` and WMI).
  - `modules/hasher` provides SHA-256, SHA-512 and BLAKE3, streaming files in
    1 MiB chunks.

## Tools

| Tool | What it does |
| --- | --- |
| System | Live CPU, memory, disks, battery, uptime and the processes using the most memory. |
| Cleaner | Measures temporary files, shader caches, thumbnails, crash dumps and Prefetch, then deletes only what you select. |
| Startup | Lists Run keys and Startup folder entries, and moves entries aside instead of deleting them. |
| Apps | Lists the programs in the uninstall registry keys, with their size and the exact uninstaller command. |
| Devices | Every present Plug and Play device, its class, status, problem code and driver version. |
| Developer | JSON, Hash, UUID, Base64, Timestamp and Color. |

## Safety model

System tools are allowed to be useful, but not surprising:

- **Nothing happens on navigation.** The cleaner measures files; deletion only
  starts after a confirmation dialog that names the size and folders.
- **The cleaner has a fixed allowlist.** It never deletes a path the page chose,
  never removes the target folders themselves, never follows symbolic links,
  and reports files it skipped because they were in use.
- **The uninstaller is the program's own.** Highgarden reads the registered
  command, shows it in the confirmation dialog, and runs exactly that command.
  It does not invent deletion paths or remove registry keys itself.
- **Startup entries are reversible.** A disabled Run value moves to
  `Software\Highgarden\StartupDisabled` in the same hive; a Startup folder
  entry is renamed with a `.disabled` suffix. Both appear in the list and can be
  enabled again.
- **No elevation tricks.** The app tells you when it is a standard user. It
  never bypasses UAC; machine-wide changes simply fail with the system's error.
- **Read-only where it matters.** Devices, installed programs and startup
  entries are read first; the only writes are the actions you confirm.

The invariants behind these rules, the cleaner allowlist and the startup
backup format are in [docs/system-tools.md](docs/system-tools.md).

## Run it

```sh
bun install
bun run dev        # mygo dev: Vite, Go, and the Rust modules
bun run build      # mygo build: a packaged app in build/
```

Requirements: Go (see `go.mod`), Bun and Rust. On Windows the MSVC build tools
link the Rust libraries; `mygo doctor` reports what is missing. The system
tools are Windows-only; the developer utilities and the shell open elsewhere.

## Layout

```
src/
  framework/tool.ts       the tool contract, categories and search
  tools/                  one module per tool, plus the registry
  components/ui/          Button, Input, Card, Badge, ConfirmDialog, ...
  components/shell/       title bar, sidebar, command palette, status bar
  routes/                 home, tool host, settings, error and 404 pages
  lib/preferences.ts      preferences, mirrored to localStorage for first paint
  lib/system.ts           system info and Windows page shortcuts
  style.css               Tailwind entry, tokens, utilities
internal/app/             Go services: Preferences, System, Files, Digest,
                          Apps, Cleaner, Startup, and the sysprobe client
modules/sysprobe/         Go interface + Rust implementation (sysinfo + WMI)
modules/hasher/           Go interface + Rust implementation (SHA-2, BLAKE3)
```

## Add a tool

A tool is a module with a default-exported component plus metadata. The
sidebar, home page, command palette and routing all come from the registry:

```ts
// src/tools/index.ts
import { IconRocket } from "@/components/icons";
import { defineTool } from "@/framework/tool";

export const tools = [
  defineTool({
    id: "startup",
    title: "Startup",
    summary: "See what starts when you sign in.",
    category: "cleanup",          // system | cleanup | apps | hardware | developer
    keywords: ["boot", "login"],
    icon: IconRocket,
    windows: true,                // shows the Windows badge
    load: () => import("./startup"),
  }),
];
```

```tsx
// src/tools/startup.tsx
export default function StartupTool() {
  return <div>...</div>;
}
```

Add a category in `src/framework/tool.ts` when a new group appears.

## Languages

The interface ships in English and Simplified Chinese. `src/lib/i18n/en.ts` is
the source of truth; `zh-CN.ts` is typed as `Messages`, so a key missing from a
translation fails `bun run typecheck` instead of falling back at runtime.

```tsx
import { t } from "@/lib/i18n";

<p>{t("tools.json.format")}</p>
<span>{t("tools.cleaner.files", { count: target.files })}</span>
```

- `t(key, params?)` reads the current language and fills `{placeholders}`.
  Read it inside JSX or a memo and the view follows the language picker in
  Settings.
- A tool is named by `tools.<id>.title` and `tools.<id>.summary`. A tool the
  catalogs do not know yet keeps the `title` and `summary` of its registry
  entry, so a new tool works before it is translated; keep those in English.
- Content the Go services report (cleaner targets, programs, devices, startup
  entries) is data. Where it is ours to name, the frontend looks the id up in
  the catalogs (`tools.cleaner.targets.<id>.name`) and otherwise shows the
  string the service sent.
- The language is stored as `locale` beside the other preferences (Go
  `Prefs.Locale`), mirrored to `localStorage`, and applied to `<html lang>`.
  An empty value lets the system language decide.
- Dates, relative times and collation use the chosen language too, through
  `locale()` and `Intl`.

To add a language: write `src/lib/i18n/<tag>.ts` typed as `Messages`, add it to
`catalogs` and `locales` in `src/lib/i18n/index.ts`, and to `locales` in
`internal/app/preferences.go`. `bun test` checks that every catalog holds the
same keys and the same placeholders.

## Go services

Values bound in `main.go` become typed TypeScript in `src/mygo.ts`:

```go
mygo.Bind(app.Apps{})
mygo.Bind(app.Cleaner{})
mygo.Bind(app.Startup{})
```

```ts
import { Cleaner } from "@/mygo";

const targets = await Cleaner.scan();     // read-only
await Cleaner.clean(["user-temp"]);       // only after the confirmation dialog
```

Methods run on their own goroutines. A `context.Context` first parameter is
canceled when the page navigates away or the window closes; the cleaner and the
probe check it while walking files and reading the machine.

## Native methods

`modules/sysprobe` and `modules/hasher` are normal Go packages whose interfaces
are implemented in Rust. The generated files (`*_native.go`, `rust/src/mygo.rs`)
are not edited.

1. Change the interface in the module's `.go` file.
2. Run `bunx mygo native check modules/<name>`.
3. Implement the new methods in `rust/src/lib.rs`.
4. Call one without the app:
   `bunx mygo native call modules/sysprobe Probe.Snapshot '{}'`
5. Test from Go: `go test ./modules/<name>` (after `mygo native check` built it).

Windows-specific code lives behind `#[cfg(windows)]`; other platforms compile
the same module and report unsupported operations instead of failing the build.

## Keyboard

| Keys | Action |
| --- | --- |
| `Ctrl/Cmd+K` | Search every tool |
| `Ctrl/Cmd+B` | Collapse or show the sidebar |
| `Esc` | Close the palette or a dialog |

## Design tokens

`src/style.css` defines semantic colors (`bg`, `surface`, `border`, `fg`,
`muted`, `accent`, `danger`, `success`, `warning`) in `:root` and `.dark`,
maps them into Tailwind with `@theme inline`, and adds accent presets under
`[data-accent="…"]`. Prefer these utilities over raw palette colors. The title
bar uses MyGo's `--mygo-titlebar-*` variables to stay clear of the native
window controls.

## Verify

```sh
bun run typecheck
bun run lint
bun run build:web
go test ./...
go vet ./...
bunx mygo vet .
```

## Known limits

- Scheduled tasks and Windows services are not managed yet; Startup covers the
  Run keys and Startup folders.
- The cleaner's allowlist is intentionally small: no browser caches, Windows
  Update downloads or the Recycle Bin yet.
- Devices and installed programs are read-only beyond running an uninstaller.
- The app does not relaunch itself elevated; use "Run as administrator".

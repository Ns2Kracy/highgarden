import { IconPanelLeft, IconSearch } from "@/components/icons";
import { Button, Kbd } from "@/components/ui";
import { t } from "@/lib/i18n";
import { isMac } from "@/lib/platform";
import { prefs, toggleSidebar } from "@/lib/preferences";
import { openCommandPalette } from "@/lib/shell";

/**
 * The title bar the page draws. MyGo keeps the window controls and gives
 * their inset to the `.titlebar` utility in src/style.css, so this bar sits
 * beside the traffic lights on macOS and the buttons on Windows and Linux.
 */
export function TitleBar() {
  return (
    <header class="titlebar relative z-20 flex shrink-0 items-center gap-2 border-b border-border bg-surface/75 backdrop-blur-xl">
      <div class="flex min-w-0 items-center gap-2 px-3">
        <div class="grid size-5 shrink-0 place-items-center rounded-md bg-accent text-[10px] font-bold text-accent-fg">
          H
        </div>
        <span class="truncate text-[13px] font-semibold tracking-tight">Highgarden</span>
      </div>

      <div class="flex min-w-0 flex-1 justify-center px-2">
        <button
          type="button"
          class="no-drag flex h-7 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface-2/70 px-2.5 text-xs text-muted transition-colors hover:border-border-strong hover:text-fg"
          onClick={openCommandPalette}
        >
          <IconSearch class="size-3.5" />
          <span class="flex-1 truncate text-left">{t("titlebar.search")}</span>
          <span class="flex items-center gap-1">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>

      <div class="flex items-center gap-1 px-2">
        <Button
          variant="ghost"
          size="icon"
          class="no-drag"
          title={
            prefs().sidebarCollapsed ? t("titlebar.showSidebar") : t("titlebar.hideSidebar")
          }
          aria-label={t("titlebar.toggleSidebar")}
          onClick={toggleSidebar}
        >
          <IconPanelLeft />
        </Button>
      </div>
    </header>
  );
}

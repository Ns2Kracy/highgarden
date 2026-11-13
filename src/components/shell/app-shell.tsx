import { Outlet } from "@tanstack/solid-router";
import { onSettled } from "solid-js";
import { toggleSidebar } from "@/lib/preferences";
import { closeCommandPalette, commandOpen, toggleCommandPalette } from "@/lib/shell";
import { CommandPalette } from "./command-palette";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { TitleBar } from "./titlebar";

/**
 * The frame every page lives in: title bar, sidebar, the routed page and
 * the status bar, with the keyboard shortcuts of the app.
 */
export function AppShell() {
  onSettled(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (mod && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
        return;
      }
      if (event.key === "Escape" && commandOpen()) {
        event.preventDefault();
        closeCommandPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <div class="flex h-full flex-col overflow-hidden bg-bg text-fg">
      <TitleBar />
      <div class="flex min-h-0 flex-1">
        <Sidebar />
        <main class="min-w-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <StatusBar />
      <CommandPalette />
    </div>
  );
}

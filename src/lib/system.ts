import { isMyGo } from "mygo-runtime";
import { System, type SystemInfo } from "@/mygo";

/**
 * System information, or a stand-in when the page is open in a browser. The
 * dev server is handy for layout work, where no Go runtime answers calls.
 */
export function systemInfo(): Promise<SystemInfo> {
  if (isMyGo()) return System.info();
  return Promise.resolve({
    os: "web",
    arch: "browser",
    goVersion: "—",
    hostname: "browser preview",
    numCPU: navigator.hardwareConcurrency ?? 0,
    engine: "go",
    appVersion: "dev",
    packaged: false,
    elevated: false,
    dataDir: "Only available in the app",
  });
}

/** Opens the user data directory; only the app can. */
export function openDataDir(): Promise<void> {
  if (!isMyGo()) return Promise.reject(new Error("Only available in the app."));
  return System.openDataDir();
}

import { isMyGo } from "mygo-runtime";
import { System, type SystemInfo } from "@/mygo";
import { t } from "./i18n";

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
    dataDir: t("errors.appOnly"),
  });
}

/** Opens the user data directory; only the app can. */
export function openDataDir(): Promise<void> {
  if (!isMyGo()) return Promise.reject(new Error(t("errors.appOnly")));
  return System.openDataDir();
}

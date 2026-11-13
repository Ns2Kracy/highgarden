import { isMyGo, runtime } from "mygo-runtime";

export type Platform = "darwin" | "linux" | "win32" | "web";

/** The operating system, or "web" when the page is open in a browser. */
export function platform(): Platform {
  if (!isMyGo()) return "web";
  try {
    return runtime().platform;
  } catch {
    return "web";
  }
}

export const isMac = platform() === "darwin";

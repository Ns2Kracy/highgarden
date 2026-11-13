import {
  IconActivity,
  IconBraces,
  IconClock,
  IconFileText,
  IconHash,
  IconKeyRound,
  IconPackage,
  IconPalette,
  IconRocket,
  IconTrash,
  IconUsb,
} from "@/components/icons";
import { defineTool, type Tool } from "@/framework/tool";

/**
 * Every tool of the toolbox. Add one beside these: a module that default
 * exports a component, and an entry here. The sidebar, the home page and
 * the command palette are built from this list.
 */
export const tools: Tool[] = [
  defineTool({
    id: "system",
    title: "System",
    summary: "Live CPU, memory, disks, battery and the processes using the most memory.",
    category: "system",
    keywords: ["overview", "dashboard", "performance", "cpu", "memory", "disk", "process"],
    icon: IconActivity,
    native: true,
    load: () => import("./system"),
  }),
  defineTool({
    id: "cleaner",
    title: "Cleaner",
    summary: "Measure and empty temporary files, shader caches, thumbnails and crash dumps.",
    category: "cleanup",
    keywords: ["temp", "cache", "junk", "disk space", "free space", "cleanup"],
    icon: IconTrash,
    windows: true,
    load: () => import("./cleaner"),
  }),
  defineTool({
    id: "startup",
    title: "Startup",
    summary: "See what starts when you sign in, and turn entries off without deleting them.",
    category: "cleanup",
    keywords: ["boot", "login", "autorun", "run key", "startup folder"],
    icon: IconRocket,
    windows: true,
    load: () => import("./startup"),
  }),
  defineTool({
    id: "apps",
    title: "Apps",
    summary: "Review installed programs, their size, and run their own uninstallers.",
    category: "apps",
    keywords: ["uninstall", "programs", "software", "registry", "remove"],
    icon: IconPackage,
    windows: true,
    load: () => import("./apps"),
  }),
  defineTool({
    id: "devices",
    title: "Devices",
    summary: "Every connected Plug and Play device, with its class, status and driver version.",
    category: "hardware",
    keywords: ["usb", "hid", "peripherals", "keyboard", "mouse", "bluetooth", "driver", "device manager"],
    icon: IconUsb,
    native: true,
    windows: true,
    load: () => import("./devices"),
  }),

  defineTool({
    id: "json",
    title: "JSON",
    summary: "Format, minify and validate JSON, with the position of errors.",
    category: "developer",
    keywords: ["format", "pretty", "minify", "validate", "parse"],
    icon: IconBraces,
    load: () => import("./json"),
  }),
  defineTool({
    id: "hash",
    title: "Hash",
    summary: "SHA-256, SHA-512 and BLAKE3 for text and files.",
    category: "developer",
    keywords: ["sha256", "sha512", "blake3", "digest", "checksum", "file"],
    icon: IconHash,
    native: true,
    load: () => import("./hash"),
  }),
  defineTool({
    id: "uuid",
    title: "UUID",
    summary: "Generate random UUIDs for tests, seeds and identifiers.",
    category: "developer",
    keywords: ["guid", "identifier", "random", "v4"],
    icon: IconKeyRound,
    load: () => import("./uuid"),
  }),
  defineTool({
    id: "base64",
    title: "Base64",
    summary: "Encode and decode text as Base64 or Base64URL.",
    category: "developer",
    keywords: ["encode", "decode", "base64url", "binary"],
    icon: IconFileText,
    load: () => import("./base64"),
  }),
  defineTool({
    id: "timestamp",
    title: "Timestamp",
    summary: "Convert Unix timestamps to dates and dates to timestamps.",
    category: "developer",
    keywords: ["unix", "epoch", "iso", "date", "time", "utc"],
    icon: IconClock,
    load: () => import("./timestamp"),
  }),
  defineTool({
    id: "color",
    title: "Color",
    summary: "Convert between HEX, RGB and HSL, and preview a tint scale.",
    category: "developer",
    keywords: ["hex", "rgb", "hsl", "palette", "shade", "css"],
    icon: IconPalette,
    load: () => import("./color"),
  }),
];

export const toolsById = new Map(tools.map((tool) => [tool.id, tool]));

/** The tools of a category, in registry order. */
export function toolsInCategory(category: string): Tool[] {
  return tools.filter((tool) => tool.category === category);
}

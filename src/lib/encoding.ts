import { t } from "./i18n";

/** Formats a byte count for people. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/** Encodes UTF-8 text as Base64, the URL-safe alphabet when asked. */
export function encodeBase64(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);
  return urlSafe ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : base64;
}

/** Decodes Base64 or Base64URL text as UTF-8. Throws on invalid input. */
export function decodeBase64(value: string, urlSafe = false): string {
  let text = value.trim().replace(/\s+/g, "");
  if (urlSafe) text = text.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = text.length % 4;
  if (remainder === 1) throw new Error(t("errors.invalidBase64Length"));
  if (remainder === 2) text += "==";
  else if (remainder === 3) text += "=";

  let binary: string;
  try {
    binary = atob(text);
  } catch {
    throw new Error(t("errors.invalidBase64Alphabet"));
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(t("errors.invalidUtf8"));
  }
}

import { describe, expect, test } from "bun:test";
import { en } from "./en";
import { zhCN } from "./zh-CN";
import { detectLocale, hasMessage, isLocale, locale, setLocale, t } from "./index";

function leaves(node: unknown, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (typeof node !== "object" || node === null) return [];
  return Object.entries(node).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("catalogs", () => {
  test("Chinese covers every English key", () => {
    const english = leaves(en).sort();
    const chinese = leaves(zhCN).sort();
    expect(chinese).toEqual(english);
  });

  test("placeholders match between languages", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of leaves(en)) {
      const lookup = (text: string) => key.split(".").reduce<unknown>(
        (node, part) => (typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[part]
          : undefined),
        text,
      ) as string;
      expect({ key, placeholders: placeholders(lookup(zhCN as unknown as string)) }).toEqual({
        key,
        placeholders: placeholders(lookup(en as unknown as string)),
      });
    }
  });
});

describe("t", () => {
  test("follows the current language", () => {
    setLocale("en");
    expect(t("common.copy")).toBe("Copy");
    setLocale("zh-CN");
    expect(t("common.copy")).toBe("复制");
    expect(locale()).toBe("zh-CN");
    setLocale("en");
  });

  test("fills placeholders and keeps unknown ones", () => {
    setLocale("zh-CN");
    expect(t("tools.cleaner.confirmTitle", { size: "12 MB" })).toBe("删除 12 MB？");
    setLocale("en");
    expect(t("home.toolsCount", { count: 3 })).toBe("3 tools");
    expect(t("home.toolsCount", { other: 3 })).toBe("{count} tools");
  });

  test("knows which keys exist", () => {
    expect(hasMessage("tools.json.format")).toBe(true);
    expect(hasMessage("tools.unknown.title")).toBe(false);
  });
});

describe("locale", () => {
  test("accepts the languages we ship", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("zh-CN")).toBe(true);
    expect(isLocale("zh_CN")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  test("reads the language the system asks for", () => {
    expect(detectLocale(["zh-Hans-CN", "en-US"])).toBe("zh-CN");
    expect(detectLocale(["zh_CN"])).toBe("zh-CN");
    expect(detectLocale(["en-GB"])).toBe("en");
    expect(detectLocale(["fr-FR"])).toBe("en");
    expect(detectLocale([])).toBe("en");
  });
});

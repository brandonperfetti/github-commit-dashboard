import { describe, expect, it, vi } from "vitest";
import {
  getConfiguredActivityTimezone,
  sanitizeTimezone,
} from "@/lib/timezone";
import { normalizeHttpUrl } from "@/lib/url";

describe("sanitizeTimezone", () => {
  it("accepts IANA names and trims whitespace", () => {
    expect(sanitizeTimezone("America/New_York")).toBe("America/New_York");
    expect(sanitizeTimezone("  UTC ")).toBe("UTC");
  });

  it("rejects unknown or empty values", () => {
    expect(sanitizeTimezone("Mars/Olympus")).toBeNull();
    expect(sanitizeTimezone("")).toBeNull();
    expect(sanitizeTimezone(undefined)).toBeNull();
  });
});

describe("getConfiguredActivityTimezone", () => {
  it("reads the server-side variable first", () => {
    vi.stubEnv("ACTIVITY_HEATMAP_TIMEZONE", "Europe/Berlin");
    vi.stubEnv("NEXT_PUBLIC_ACTIVITY_HEATMAP_TIMEZONE", "Asia/Tokyo");
    expect(getConfiguredActivityTimezone()).toBe("Europe/Berlin");
  });

  it("falls back to the public variable, then to UTC", () => {
    vi.stubEnv("ACTIVITY_HEATMAP_TIMEZONE", undefined);
    vi.stubEnv("NEXT_PUBLIC_ACTIVITY_HEATMAP_TIMEZONE", "Asia/Tokyo");
    expect(getConfiguredActivityTimezone()).toBe("Asia/Tokyo");

    vi.stubEnv("NEXT_PUBLIC_ACTIVITY_HEATMAP_TIMEZONE", "Nowhere/Real");
    expect(getConfiguredActivityTimezone()).toBe("UTC");
  });
});

describe("normalizeHttpUrl", () => {
  it("adds https to bare hosts and keeps http(s) URLs", () => {
    expect(normalizeHttpUrl("example.com")).toBe("https://example.com/");
    expect(normalizeHttpUrl("https://alpha.example.com/docs")).toBe(
      "https://alpha.example.com/docs",
    );
    expect(normalizeHttpUrl("http://localhost:3000")).toBe(
      "http://localhost:3000/",
    );
  });

  it("refuses anything that is not a web URL, so repo homepages cannot inject other schemes", () => {
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("ftp://files.example.com")).toBeNull();
    expect(normalizeHttpUrl("not a url")).toBeNull();
    expect(normalizeHttpUrl("")).toBeNull();
    expect(normalizeHttpUrl(null)).toBeNull();
  });
});

describe("getPublicSiteUrl", () => {
  async function loadFresh() {
    vi.resetModules();
    return (await import("@/lib/site-config")).getPublicSiteUrl;
  }

  it("strips trailing slashes from the configured URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://github.brandonperfetti.com/");
    const getPublicSiteUrl = await loadFresh();
    expect(getPublicSiteUrl()).toBe("https://github.brandonperfetti.com");
  });

  it("falls back to localhost only in development", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("NODE_ENV", "development");
    const getPublicSiteUrl = await loadFresh();
    expect(getPublicSiteUrl()).toBe("http://localhost:3000");
  });

  it("throws outside development when the URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);
    vi.stubEnv("NODE_ENV", "production");
    const getPublicSiteUrl = await loadFresh();
    expect(() => getPublicSiteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });
});

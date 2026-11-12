import { describe, expect, it } from "vitest";
import { canonicalizeUrl, isSupportedUrl, domainOf } from "./url";
import { findQuote, normalizeText } from "./text";
import { dayBounds, localDay, formatDay } from "./dates";
import { groupBySite } from "./group";
import { toMarkdown } from "./markdown";
import type { Highlight, Note } from "./types";

describe("canonicalizeUrl", () => {
  it("strips tracking, hash, www, trailing slash and sorts params", () => {
    expect(canonicalizeUrl("http://WWW.Example.com/a/b/?utm_source=x&z=1&a=2#frag"))
      .toBe("https://example.com/a/b?a=2&z=1");
  });
  it("keeps meaningful params", () => {
    expect(canonicalizeUrl("https://news.ycombinator.com/item?id=1")).toBe("https://news.ycombinator.com/item?id=1");
  });
  it("domainOf", () => expect(domainOf("https://www.medium.com/x")).toBe("medium.com"));
  it("restricted pages", () => {
    expect(isSupportedUrl("chrome://extensions")).toBe(false);
    expect(isSupportedUrl("https://chromewebstore.google.com/detail/x")).toBe(false);
    expect(isSupportedUrl("https://example.com")).toBe(true);
  });
});

describe("findQuote", () => {
  const text = "The cat sat on the mat. Later, the cat sat on the sofa. The end.";
  it("normalizes", () => expect(normalizeText("  Hello\n  World ")).toBe("hello world"));
  it("finds a unique quote", () => {
    const m = findQuote(text, { exact: "Later", prefix: "mat. ", suffix: ", the" })!;
    expect(text.slice(m.start, m.end)).toBe("Later");
  });
  it("disambiguates repeated text with context", () => {
    const m = findQuote(text, { exact: "the cat sat on the", prefix: "Later, ", suffix: " sofa" })!;
    expect(m.start).toBe(text.indexOf("the cat sat on the", 10));
  });
  it("refuses ambiguous matches", () => {
    expect(findQuote("ab ab", { exact: "ab", prefix: "zz", suffix: "yy" })).toBeNull();
  });
  it("tolerates whitespace changes", () => {
    const m = findQuote("Hello\n\n   big   world!", { exact: "big world", prefix: "Hello ", suffix: "!" })!;
    expect(m).not.toBeNull();
  });
  it("returns null when missing", () => expect(findQuote(text, { exact: "dog", prefix: "", suffix: "" })).toBeNull());
});

describe("dates", () => {
  it("localDay respects timezone", () => {
    expect(localDay("2026-11-12T20:00:00Z", "Asia/Kolkata")).toBe("2026-11-13");
    expect(localDay("2026-11-12T20:00:00Z", "America/New_York")).toBe("2026-11-12");
  });
  it("dayBounds", () => {
    expect(dayBounds("2026-11-12", "Asia/Kolkata")).toEqual({
      start: "2026-11-11T18:30:00.000Z", end: "2026-11-12T18:30:00.000Z",
    });
    expect(dayBounds("2026-03-08", "America/New_York")).toEqual({
      start: "2026-03-08T05:00:00.000Z", end: "2026-03-09T04:00:00.000Z",
    });
  });
  it("formatDay", () => expect(formatDay("2026-11-12")).toBe("November 12, 2026"));
});

const h = (over: Partial<Highlight>): Highlight => ({
  id: "1", user_id: "u", selected_text: "Text", note: null, source_url: "https://a.com/x",
  canonical_url: "https://a.com/x", page_title: "A", domain: "a.com", prefix: "", suffix: "",
  anchor_data: {}, created_at: "2026-11-12T05:15:00Z", updated_at: "2026-11-12T05:15:00Z", ...over,
});

describe("grouping and markdown", () => {
  it("groups by site", () => {
    const g = groupBySite([h({ id: "1" }), h({ id: "2", domain: "b.com" }), h({ id: "3" })]);
    expect(g.map((x) => x.domain)).toEqual(["a.com", "b.com"]);
    expect(g[0].highlights).toHaveLength(2);
  });
  it("renders markdown", () => {
    const note: Note = { id: "n", user_id: "u", title: "Product Ideas", content: "My idea ✨", created_at: "2026-11-12T06:00:00Z", updated_at: "2026-11-12T06:00:00Z" };
    const md = toMarkdown([h({ note: "Mine" })], [note], "Asia/Kolkata");
    expect(md).toContain("# November 12, 2026");
    expect(md).toContain("## a.com");
    expect(md).toContain("> Text");
    expect(md).toContain("**Note:** Mine");
    expect(md).toContain("Saved at: 10:45 AM");
    expect(md).toContain("### Product Ideas");
    expect(md).toContain("✨");
  });
});

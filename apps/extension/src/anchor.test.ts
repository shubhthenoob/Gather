// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { findQuote } from "@highlight/shared";
import { buildIndex, offsetsToRange, rangeToOffsets, trimOffsets } from "./anchor";

describe("anchor", () => {
  it("round-trips a selection across elements", () => {
    document.body.innerHTML = `<article><p>First para with <b>bold</b> text.</p><p>Second para here.</p></article>`;
    const index = buildIndex();
    expect(index.text).toBe("\nFirst para with bold text.\nSecond para here.\n".replace(/^\n/, ""));
    const r = document.createRange();
    const b = document.querySelector("b")!.firstChild!;
    r.setStart(b, 1);
    r.setEnd(document.querySelectorAll("p")[1].firstChild!, 6);
    const off = rangeToOffsets(index, r)!;
    expect(index.text.slice(off.start, off.end)).toBe("old text.\nSecond");
    const back = offsetsToRange(index, off.start, off.end)!;
    expect(back.startContainer).toBe(b);
    expect(back.endOffset).toBe(6);
  });

  it("restores after markup changes using the quote", () => {
    document.body.innerHTML = `<div><p>Alpha beta gamma.</p><p>Delta epsilon.</p></div>`;
    const before = buildIndex();
    const s = before.text.indexOf("beta gamma");
    const quote = { exact: "beta gamma", prefix: before.text.slice(0, s), suffix: before.text.slice(s + 10, s + 30) };
    document.body.innerHTML = `<main><section><p>Alpha <em>beta</em> gamma.</p></section><p>Delta epsilon.</p></main>`;
    const after = buildIndex();
    const m = findQuote(after.text, quote)!;
    const range = offsetsToRange(after, m.start, m.end)!;
    expect(range.toString()).toBe("beta gamma");
  });

  it("trims whitespace", () => {
    expect(trimOffsets("  hi  ", 0, 6)).toEqual({ start: 2, end: 4 });
  });
});

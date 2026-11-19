import { describe, expect, it } from "vitest";
import { categoriesOf, highlightColor, highlightFill, nextColor, PALETTE, UNCATEGORISED_COLOR, type Category } from "./index";

const cat = (id: string, color: string, name = id): Category => ({ id, user_id: "u", name, color, created_at: "", last_used_at: "" });

describe("categories", () => {
  it("assigns unused palette colours in order, then cycles", () => {
    expect(nextColor([])).toBe(PALETTE[0]);
    expect(nextColor([cat("a", PALETTE[0])])).toBe(PALETTE[1]);
    expect(nextColor(PALETTE.map((c, i) => cat(String(i), c)))).toBe(PALETTE[0]);
  });

  it("uses the main (first) category's colour, or yellow when uncategorised", () => {
    const all = [cat("a", "#111111"), cat("b", "#222222")];
    expect(highlightColor({ category_ids: ["b", "a"] }, all)).toBe("#222222");
    expect(highlightColor({ category_ids: [] }, all)).toBe(UNCATEGORISED_COLOR);
    expect(highlightColor({}, all)).toBe(UNCATEGORISED_COLOR);
  });

  it("skips deleted categories", () => {
    expect(categoriesOf({ category_ids: ["gone", "a"] }, [cat("a", "#111111")]).map((c) => c.id)).toEqual(["a"]);
  });

  it("draws dark colours as a lighter wash so text stays readable", () => {
    const dark = Number(highlightFill("#101030").match(/[\d.]+\)$/)![0].slice(0, -1));
    const light = Number(highlightFill("#fbbc04").match(/[\d.]+\)$/)![0].slice(0, -1));
    expect(dark).toBeLessThan(light);
    expect(highlightFill("not-a-colour")).toContain("251, 188, 4");
  });
});

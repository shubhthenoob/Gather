import type { Category, Highlight } from "./types";

/** Colour of uncategorised highlights (Gather yellow). */
export const UNCATEGORISED_COLOR = "#fbbc04";

/** Preset category colours, in the order new categories receive them. */
export const PALETTE = ["#34a853", "#4285f4", "#e8608c", "#9c6ade", "#fa7b17", "#12b5cb", "#ea4335"] as const;

/** Names for the preset colours, used as the default name of a new unnamed category. */
export const PALETTE_NAMES: Record<string, string> = {
  "#34a853": "Green", "#4285f4": "Blue", "#e8608c": "Pink", "#9c6ade": "Purple",
  "#fa7b17": "Orange", "#12b5cb": "Teal", "#ea4335": "Red", "#fbbc04": "Yellow",
};

export function isHexColor(c: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(c);
}

/** The next preset colour not already used, cycling once all are taken. */
export function nextColor(existing: Pick<Category, "color">[]): string {
  const used = new Set(existing.map((c) => c.color.toLowerCase()));
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[existing.length % PALETTE.length];
}

/**
 * Translucent fill for drawing a highlight over text. Any colour, including a dark custom one,
 * stays readable because only a light wash of it covers the text.
 */
export function highlightFill(hex: string, strong = false): string {
  const c = isHexColor(hex) ? hex : UNCATEGORISED_COLOR;
  const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
  // Darker colours get a lighter wash so text keeps its contrast.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const alpha = (luminance < 0.45 ? 0.28 : 0.42) + (strong ? 0.14 : 0);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

/** The categories a highlight belongs to, main category first, skipping deleted ones. */
export function categoriesOf(h: Pick<Highlight, "category_ids">, all: Category[]): Category[] {
  const byId = new Map(all.map((c) => [c.id, c]));
  return (h.category_ids ?? []).map((id) => byId.get(id)).filter((c): c is Category => !!c);
}

/** Colour a highlight is drawn in: its main category's colour, or yellow when uncategorised. */
export function highlightColor(h: Pick<Highlight, "category_ids">, all: Category[]): string {
  return categoriesOf(h, all)[0]?.color ?? UNCATEGORISED_COLOR;
}

/** Most recently used first. */
export function byRecent(a: Category, b: Category): number {
  return b.last_used_at.localeCompare(a.last_used_at) || a.name.localeCompare(b.name);
}

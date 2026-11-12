export const CONTEXT_LENGTH = 64;

/** Collapse whitespace and lowercase. Mirrors the normalised_text column in SQL. */
export function normalizeText(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

export interface TextQuote {
  exact: string;
  prefix: string;
  suffix: string;
  /** Approximate offset where the quote started when saved. */
  hint?: number;
}

export interface TextMatch {
  start: number;
  end: number;
  score: number;
}

/** Similarity of two strings in [0,1], measured as the longest common suffix/prefix ratio. */
function suffixSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i / Math.max(a.length, b.length, 1);
}
function prefixSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i / Math.max(a.length, b.length, 1);
}

/**
 * Locate a saved quote in page text. Whitespace-insensitive: the haystack is
 * compared through a collapsed-whitespace view and offsets map back to the original.
 *
 * Returns null when the quote is missing or every occurrence is ambiguous, so the
 * caller never paints the wrong passage.
 */
export function findQuote(text: string, quote: TextQuote, minScore = 0.5): TextMatch | null {
  const { collapsed, map } = collapse(text);
  const exact = collapse(quote.exact).collapsed;
  if (!exact) return null;
  const prefix = collapse(quote.prefix).collapsed;
  const suffix = collapse(quote.suffix).collapsed;

  const candidates: TextMatch[] = [];
  let from = 0;
  for (;;) {
    const at = collapsed.indexOf(exact, from);
    if (at === -1) break;
    const before = collapsed.slice(Math.max(0, at - prefix.length), at);
    const after = collapsed.slice(at + exact.length, at + exact.length + suffix.length);
    const ctx = (suffixSimilarity(before, prefix) + prefixSimilarity(after, suffix)) / 2;
    let score = ctx;
    if (quote.hint !== undefined && text.length > 0) {
      const dist = Math.abs(map[at] - quote.hint) / text.length;
      score = ctx * 0.9 + (1 - dist) * 0.1;
    }
    candidates.push({ start: map[at], end: map[at + exact.length - 1] + 1, score });
    from = at + 1;
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (candidates.length === 1) return best;
  // Multiple occurrences: require the context to actually discriminate.
  if (best.score < minScore) return null;
  if (best.score - candidates[1].score < 0.05) return null;
  return best;
}

/** Collapse runs of whitespace to one space, keeping a map from collapsed index to original index. */
export function collapse(s: string): { collapsed: string; map: number[] } {
  let out = "";
  const map: number[] = [];
  let ws = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (/\s/.test(c)) {
      if (!ws && out.length > 0) {
        out += " ";
        map.push(i);
      }
      ws = true;
    } else {
      out += c;
      map.push(i);
      ws = false;
    }
  }
  if (out.endsWith(" ")) {
    out = out.slice(0, -1);
    map.pop();
  }
  return { collapsed: out, map };
}

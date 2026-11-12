/**
 * Text index over the page's rendered text nodes, used to convert between DOM
 * ranges and flat character offsets. Block boundaries contribute a synthetic
 * "\n" so stored text reads like Selection.toString() and matches across
 * structural changes.
 */

const BLOCK = new Set([
  "ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BR", "DD", "DIV", "DL", "DT", "FIELDSET", "FIGCAPTION",
  "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "LI", "MAIN", "NAV",
  "OL", "P", "PRE", "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL",
]);
const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TEXTAREA", "INPUT", "SELECT", "IFRAME", "OBJECT", "SVG", "CANVAS"]);

export const UI_HOST_ID = "highlight-ext-root";

export interface IndexEntry { node: Text; start: number; end: number }
export interface TextIndex { text: string; entries: IndexEntry[] }

export function buildIndex(root: Node = document.body): TextIndex {
  let text = "";
  const entries: IndexEntry[] = [];
  const newline = () => { if (text.length && !text.endsWith("\n")) text += "\n"; };
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node as Text;
      const v = t.data;
      if (!v) return;
      entries.push({ node: t, start: text.length, end: text.length + v.length });
      text += v;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toUpperCase();
    if (SKIP.has(tag) || el.id === UI_HOST_ID) return;
    if (el instanceof HTMLElement && el.hidden) return;
    const block = BLOCK.has(tag);
    if (block) newline();
    for (let c = el.firstChild; c; c = c.nextSibling) walk(c);
    if (block) newline();
  };
  walk(root);
  return { text, entries };
}

/** Flat [start, end) offsets of a DOM range within the index, or null if it touches no indexed text. */
export function rangeToOffsets(index: TextIndex, range: Range): { start: number; end: number } | null {
  let start = -1;
  for (const e of index.entries) {
    if (e.node === range.startContainer) { start = e.start + range.startOffset; break; }
    try {
      if (range.comparePoint(e.node, 0) >= 0) { start = e.start; break; }
    } catch { /* node outside range's document */ }
  }
  let end = -1;
  for (let i = index.entries.length - 1; i >= 0; i--) {
    const e = index.entries[i];
    if (e.node === range.endContainer) { end = e.start + range.endOffset; break; }
    try {
      if (range.comparePoint(e.node, e.node.length) <= 0) { end = e.end; break; }
    } catch { /* ignore */ }
  }
  if (start < 0 || end < 0 || end <= start) return null;
  return { start, end };
}

function entryAt(entries: IndexEntry[], offset: number, preferNext: boolean): IndexEntry | null {
  let lo = 0, hi = entries.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const e = entries[mid];
    if (offset < e.start) hi = mid - 1;
    else if (offset > e.end) lo = mid + 1;
    else if (offset === e.end && preferNext && mid + 1 < entries.length && entries[mid + 1].start === offset) return entries[mid + 1];
    else if (offset === e.start && !preferNext && mid > 0 && entries[mid - 1].end === offset) return entries[mid - 1];
    else return e;
  }
  // Offset falls on a synthetic newline: snap forward for starts, backward for ends.
  if (preferNext) return entries[lo] ?? null;
  return entries[hi] ?? null;
}

export function offsetsToRange(index: TextIndex, start: number, end: number): Range | null {
  const a = entryAt(index.entries, start, true);
  const b = entryAt(index.entries, end, false);
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a.node, Math.max(0, Math.min(a.node.length, start - a.start)));
  range.setEnd(b.node, Math.max(0, Math.min(b.node.length, end - b.start)));
  return range.collapsed ? null : range;
}

/** Shrink [start, end) so it excludes leading and trailing whitespace. */
export function trimOffsets(text: string, start: number, end: number): { start: number; end: number } {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end };
}

/** Short XPath to the element containing a node, a restore hint only. */
export function xpathOf(node: Node): string {
  const parts: string[] = [];
  let el: Element | null = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  while (el && el !== document.body && el.parentElement) {
    const tag = el.tagName.toLowerCase();
    let i = 1;
    for (let s = el.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === el.tagName) i++;
    parts.unshift(`${tag}[${i}]`);
    el = el.parentElement;
  }
  return "/body/" + parts.join("/");
}

export interface AnchorData {
  /** XPath of the start container's parent element, relative to body. A hint only. */
  xpath?: string;
  /** Character offset of the selection within document.body.innerText-equivalent text. */
  textOffset?: number;
}

export interface Highlight {
  id: string;
  user_id: string;
  selected_text: string;
  note: string | null;
  source_url: string;
  canonical_url: string;
  page_title: string;
  domain: string;
  prefix: string;
  suffix: string;
  anchor_data: AnchorData;
  created_at: string;
  updated_at: string;
}

export type NewHighlight = Pick<
  Highlight,
  "selected_text" | "note" | "source_url" | "canonical_url" | "page_title" | "domain" | "prefix" | "suffix" | "anchor_data"
>;

export interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  kind: "highlight" | "note";
  id: string;
  title: string | null;
  body: string;
  note: string | null;
  domain: string | null;
  url: string | null;
  created_at: string;
}

export interface DayPage {
  day: string; // YYYY-MM-DD
  highlight_count: number;
  note_count: number;
}

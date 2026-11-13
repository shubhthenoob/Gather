import type { Highlight, Note } from "./types";
import { formatDay, formatTime } from "./dates";
import { groupByDay, groupBySite } from "./group";

function quote(text: string): string {
  return text.trim().split(/\r?\n/).map((l) => `> ${l}`).join("\n");
}

function renderDay(day: string, highlights: Highlight[], notes: Note[], timeZone: string): string {
  const out: string[] = [`# ${formatDay(day)}`, ""];
  for (const group of groupBySite(highlights)) {
    out.push(`## ${group.domain}`, "");
    for (const h of group.highlights) {
      out.push(quote(h.selected_text), "");
      if (h.note?.trim()) out.push(`**Note:** ${h.note.trim()}`, "");
      if (h.page_title) out.push(`Page: ${h.page_title}`, "");
      out.push(`Source: ${h.source_url}`, "", `Saved at: ${formatTime(h.created_at, timeZone)}`, "", "---", "");
    }
  }
  if (notes.length) {
    out.push("## Personal Notes", "");
    const sorted = [...notes].sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const n of sorted) {
      out.push(`### ${n.title?.trim() || "Untitled note"}`, "", n.content.trim(), "", `Saved at: ${formatTime(n.created_at, timeZone)}`, "");
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function toMarkdown(highlights: Highlight[], notes: Note[], timeZone: string): string {
  const days = groupByDay(highlights, notes, timeZone);
  if (days.length === 0) return "# Gather export\n\nNothing saved yet.\n";
  return days.map((d) => renderDay(d.day, d.highlights, d.notes, timeZone)).join("\n");
}

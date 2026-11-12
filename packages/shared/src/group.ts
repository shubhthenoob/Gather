import type { Highlight, Note } from "./types";
import { localDay } from "./dates";

export interface SiteGroup {
  domain: string;
  highlights: Highlight[];
}

/** Group a day's highlights by website, sites ordered by their most recent highlight. */
export function groupBySite(highlights: Highlight[]): SiteGroup[] {
  const map = new Map<string, Highlight[]>();
  const sorted = [...highlights].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const h of sorted) {
    const key = h.domain || "Unknown site";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(h);
  }
  return [...map.entries()].map(([domain, hs]) => ({ domain, highlights: hs }));
}

export interface DayBundle {
  day: string;
  highlights: Highlight[];
  notes: Note[];
}

/** Bucket content into local-timezone days, newest day first. */
export function groupByDay(highlights: Highlight[], notes: Note[], timeZone: string): DayBundle[] {
  const days = new Map<string, DayBundle>();
  const bucket = (day: string) => {
    if (!days.has(day)) days.set(day, { day, highlights: [], notes: [] });
    return days.get(day)!;
  };
  for (const h of highlights) bucket(localDay(h.created_at, timeZone)).highlights.push(h);
  for (const n of notes) bucket(localDay(n.created_at, timeZone)).notes.push(n);
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
}

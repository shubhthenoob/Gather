import { notFound } from "next/navigation";
import { dayBounds, formatDay, groupBySite, isValidDay, todayIn, type Highlight, type Note } from "@highlight/shared";
import { requireUser } from "@/lib/supabase/server";
import { HighlightCard } from "@/components/highlight-card";
import { NoteCard } from "@/components/note-card";
import { NewNoteButton } from "@/components/new-note-button";

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const { supabase, profile } = await requireUser();
  const tz = profile.timezone;
  const today = todayIn(tz);
  const day = date === "today" ? today : date;
  if (!isValidDay(day)) notFound();

  const { start, end } = dayBounds(day, tz);
  const [h, n] = await Promise.all([
    supabase.from("highlights").select("*").gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }),
    supabase.from("notes").select("*").gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }),
  ]);
  const highlights = (h.data ?? []) as Highlight[];
  const notes = (n.data ?? []) as Note[];
  const groups = groupBySite(highlights);
  const isToday = day === today;

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="muted text-xs font-medium uppercase tracking-wider">{isToday ? "Today" : "Daily page"}</p>
          <h1 className="text-2xl font-semibold">{formatDay(day)}</h1>
        </div>
        <div className="flex gap-2">
          {(highlights.length > 0 || notes.length > 0) && (
            <a href={`/api/export?day=${day}`} className="bordered rounded-full border px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">
              Export day
            </a>
          )}
          {isToday && <NewNoteButton />}
        </div>
      </header>

      {highlights.length === 0 && notes.length === 0 && (
        <div className="muted card p-10 text-center text-sm">
          {isToday
            ? "Nothing saved yet today. Select text on any page and click Save Highlight, or start a note."
            : "Nothing was saved on this day."}
        </div>
      )}

      {groups.map((g) => (
        <section key={g.domain} className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <img src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(g.domain)}&sz=32`} alt="" className="h-4 w-4 rounded" />
            {g.domain}
            <span className="muted font-normal">· {g.highlights.length}</span>
          </h2>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {g.highlights.map((x) => <HighlightCard key={x.id} highlight={x} timezone={tz} />)}
          </div>
        </section>
      ))}

      {notes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold">Personal Notes <span className="muted font-normal">· {notes.length}</span></h2>
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {notes.map((x) => <NoteCard key={x.id} note={x} timezone={tz} />)}
          </div>
        </section>
      )}
    </div>
  );
}

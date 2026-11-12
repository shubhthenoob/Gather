"use client";
import { useState, useTransition } from "react";
import { formatTime, type Highlight } from "@highlight/shared";
import { deleteHighlight, updateHighlightNote } from "@/app/actions";

export function HighlightCard({ highlight: h, timezone }: { highlight: Highlight; timezone: string }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(h.note ?? "");
  const [pending, start] = useTransition();

  const save = () => start(async () => {
    await updateHighlightNote(h.id, note);
    setEditing(false);
  });
  const remove = () => {
    if (!window.confirm("Delete this highlight and its note?")) return;
    start(() => deleteHighlight(h.id));
  };

  return (
    <article id={`h-${h.id}`} className={`card group mb-4 break-inside-avoid p-4 ${pending ? "opacity-60" : ""}`}>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed"><span className="mark">{h.selected_text}</span></p>

      {editing ? (
        <div className="mt-3">
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
              if (e.key === "Escape") { setNote(h.note ?? ""); setEditing(false); }
            }}
            rows={3}
            placeholder="Add a note…"
            className="bordered w-full resize-y rounded-lg border p-2 text-sm"
          />
          <div className="mt-2 flex justify-end gap-2 text-sm">
            <button onClick={() => { setNote(h.note ?? ""); setEditing(false); }} className="muted px-3 py-1">Cancel</button>
            <button onClick={save} className="rounded-md bg-[var(--accent)] px-3 py-1 font-medium text-black">Save</button>
          </div>
        </div>
      ) : (
        h.note && <p className="muted mt-3 whitespace-pre-wrap text-sm">{h.note}</p>
      )}

      <footer className="mt-3 flex items-end justify-between gap-2">
        <a href={h.source_url} target="_blank" rel="noopener noreferrer" className="min-w-0 text-xs hover:underline">
          <span className="block truncate font-medium">{h.page_title || h.domain}</span>
          <span className="muted">{h.domain} · {formatTime(h.created_at, timezone)}</span>
        </a>
        <div className="flex shrink-0 gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <button onClick={() => setEditing(true)} title={h.note ? "Edit note" : "Add note"} className="muted rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
          <button onClick={remove} title="Delete highlight" className="muted rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
          </button>
        </div>
      </footer>
    </article>
  );
}

"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { categoriesOf, formatTime, highlightColor, highlightFill, type Category, type Highlight } from "@highlight/shared";
import { deleteHighlight, updateHighlightNote } from "@/app/actions";
import { CategoryPicker, Dot } from "./category-picker";

export function HighlightCard({ highlight: h, timezone, categories = [] }: { highlight: Highlight; timezone: string; categories?: Category[] }) {
  const [ids, setIds] = useState(h.category_ids ?? []);
  const [known, setKnown] = useState(categories);
  const [picking, setPicking] = useState(false);
  // Server refreshes (realtime, other devices) replace the optimistic state.
  const serverIds = (h.category_ids ?? []).join(",");
  useEffect(() => { setIds(serverIds ? serverIds.split(",") : []); }, [serverIds]);
  useEffect(() => { setKnown(categories); }, [categories]);
  const shown = { ...h, category_ids: ids };
  const cats = categoriesOf(shown, known);
  const color = highlightColor(shown, known);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(h.note ?? "");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  // Copies the quote, the note (if any) and where it came from, ready to paste anywhere.
  const copy = async () => {
    const parts = [`“${h.selected_text.trim()}”`];
    if (h.note?.trim()) parts.push(`Note: ${h.note.trim()}`);
    parts.push(`— ${h.page_title || h.domain}\n${h.source_url}`);
    const text = parts.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers or contexts without the async clipboard API.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed"><span className="mark" style={{ background: highlightFill(color) }}>{h.selected_text}</span></p>

      {cats.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cats.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`} className="bordered inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs hover:bg-black/5 dark:hover:bg-white/10">
              <Dot color={c.color} />{c.name}
            </Link>
          ))}
        </div>
      )}

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
        h.note && (
          <div className="mt-3 flex gap-2 rounded-lg border-l-4 border-[var(--accent)] bg-black/[0.04] dark:bg-white/[0.06] px-3 py-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{h.note}</p>
          </div>
        )
      )}

      <footer className="mt-3 flex items-end justify-between gap-2">
        <a href={h.source_url} target="_blank" rel="noopener noreferrer" className="min-w-0 text-xs hover:underline">
          <span className="block truncate font-medium">{h.page_title || h.domain}</span>
          <span className="muted">{h.domain} · {formatTime(h.created_at, timezone)}</span>
        </a>
        <div className={`relative flex shrink-0 items-center gap-1 transition-opacity ${copied || picking ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"}`}>
          <button onClick={() => setPicking(!picking)} title={cats.length ? "Change categories" : "Add category"} aria-label={cats.length ? "Change categories" : "Add category"} aria-expanded={picking} className="muted rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
          </button>
          {picking && (
            <CategoryPicker
              highlightId={h.id}
              selected={ids}
              categories={known}
              onChange={(next, created) => { setIds(next); if (created) setKnown((k) => (k.some((c) => c.id === created.id) ? k : [created, ...k])); }}
              onClose={() => setPicking(false)}
            />
          )}
          <button onClick={copy} title={copied ? "Copied" : "Copy highlight"} aria-label="Copy highlight" className={`flex items-center gap-1 rounded-full p-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10 ${copied ? "text-[var(--accent)]" : "muted"}`}>
            {copied ? (
              <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg><span className="font-medium">Copied</span></>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></svg>
            )}
          </button>
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

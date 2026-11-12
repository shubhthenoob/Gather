"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { formatTime, type Note } from "@highlight/shared";
import { deleteNote, updateNote } from "@/app/actions";

type Status = "saved" | "saving" | "unsaved" | "error";

/** Standalone note with debounced autosave. */
export function NoteCard({ note, timezone }: { note: Note; timezone: string }) {
  const [title, setTitle] = useState(note.title ?? "");
  const [content, setContent] = useState(note.content);
  const [status, setStatus] = useState<Status>("saved");
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef({ title, content });
  latest.current = { title, content };
  const area = useRef<HTMLTextAreaElement>(null);
  const isNew = !note.content && !note.title;

  const flush = async () => {
    clearTimeout(timer.current);
    setStatus("saving");
    try {
      await updateNote(note.id, latest.current);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };
  const schedule = () => {
    setStatus("unsaved");
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };

  useEffect(() => {
    if (isNew) area.current?.focus();
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (timer.current) { void flush(); e.preventDefault(); }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.removeEventListener("beforeunload", beforeUnload); clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Grow the textarea with its content.
  useEffect(() => {
    const el = area.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
  }, [content]);

  const remove = () => {
    if ((title || content) && !window.confirm("Delete this note?")) return;
    clearTimeout(timer.current);
    start(() => deleteNote(note.id));
  };

  const label = { saved: "Saved", saving: "Saving…", unsaved: "Editing", error: "Not saved, retrying on next edit" }[status];

  return (
    <article id={`n-${note.id}`} className={`card group mb-4 break-inside-avoid p-4 ${pending ? "opacity-60" : ""}`}>
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); schedule(); }}
        onBlur={() => status === "unsaved" && flush()}
        placeholder="Title"
        className="w-full text-[15px] font-semibold"
      />
      <textarea
        ref={area}
        value={content}
        onChange={(e) => { setContent(e.target.value); schedule(); }}
        onBlur={() => status === "unsaved" && flush()}
        placeholder="Take a note…"
        rows={3}
        className="mt-2 w-full resize-none overflow-hidden text-sm leading-relaxed"
      />
      <footer className="mt-2 flex items-center justify-between text-xs">
        <span className={status === "error" ? "text-red-600" : "muted"}>
          {formatTime(note.created_at, timezone)} · {label}
        </span>
        <button onClick={remove} title="Delete note" className="muted rounded-full p-1.5 opacity-100 hover:bg-black/5 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
        </button>
      </footer>
    </article>
  );
}

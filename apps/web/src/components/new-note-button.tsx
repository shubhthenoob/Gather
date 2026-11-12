"use client";
import { useTransition } from "react";
import { createNote } from "@/app/actions";

export function NewNoteButton() {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(async () => { await createNote(); })}
      disabled={pending}
      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
    >
      {pending ? "Creating…" : "+ New note"}
    </button>
  );
}

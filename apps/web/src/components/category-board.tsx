"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@highlight/shared";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions";
import { ColorPalette } from "./category-picker";

/** Inline "create category" control. */
export function NewCategory() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const create = () => {
    if (!name.trim()) { setOpen(false); return; }
    start(async () => {
      try {
        const c = await createCategory(name);
        setName(""); setOpen(false); setError("");
        router.push(`/categories/${c.id}`);
      } catch (e) { setError(String((e as Error).message ?? e)); }
    });
  };
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bordered inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        New
      </button>
    );
  }
  return (
    <div className={`flex shrink-0 items-center gap-1.5 ${pending ? "opacity-60" : ""}`}>
      <input
        autoFocus
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => { if (!name.trim()) setOpen(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") { setName(""); setOpen(false); } }}
        placeholder="Category name"
        aria-label="New category name"
        className="bordered w-40 rounded-full border bg-transparent px-3 py-1.5 text-sm focus:border-[var(--accent)]"
      />
      <button onMouseDown={(e) => e.preventDefault()} onClick={create} disabled={pending} className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-black">
        {pending ? "…" : "Create"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

/** Rename, recolour, export and delete the category being viewed. */
export function CategoryControls({ category: c, count }: { category: Category; count: number }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(c.name);
  const [palette, setPalette] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>, after?: () => void) => start(async () => {
    try { setError(""); await fn(); after?.(); } catch (e) { setError(String((e as Error).message ?? e)); }
  });
  const rename = () => {
    setRenaming(false);
    if (name.trim() && name.trim() !== c.name) run(() => updateCategory(c.id, { name }));
    else setName(c.name);
  };
  const btn = "bordered rounded-full border px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5";

  return (
    <div className={`mb-5 flex flex-wrap items-center gap-3 ${pending ? "opacity-60" : ""}`}>
      <div className="relative">
        <button
          onClick={() => setPalette(!palette)}
          title="Change colour"
          aria-label={`Change colour of ${c.name}`}
          className="h-5 w-5 rounded-full ring-offset-2 transition hover:scale-110"
          style={{ background: c.color }}
        />
        {palette && <ColorPalette value={c.color} onPick={(color) => run(() => updateCategory(c.id, { color }))} onClose={() => setPalette(false)} />}
      </div>
      {renaming ? (
        <input
          autoFocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") { setName(c.name); setRenaming(false); } }}
          aria-label="Category name"
          className="bordered rounded-md border bg-transparent px-2 py-0.5 text-xl font-semibold"
        />
      ) : (
        <h2 className="text-xl font-semibold">
          <button onClick={() => setRenaming(true)} title="Rename" className="hover:underline">{c.name}</button>
        </h2>
      )}
      <span className="muted text-sm">{count} highlight{count === 1 ? "" : "s"}</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <button onClick={() => setRenaming(true)} className={btn}>Rename</button>
        {count > 0 && <a href={`/api/export?category=${c.id}`} className={btn}>Export</a>}
        <button
          onClick={() => { if (confirm(`Delete “${c.name}”? Its highlights are kept and become uncategorised.`)) run(() => deleteCategory(c.id), () => router.push("/categories")); }}
          className={`${btn} text-red-600 dark:text-red-400`}
        >
          Delete
        </button>
      </div>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

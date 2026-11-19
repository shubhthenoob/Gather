"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { UNCATEGORISED_COLOR, type Category } from "@highlight/shared";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions";
import { ColorPalette, Dot } from "./category-picker";

export interface CategorySummary {
  category: Category;
  count: number;
  previews: string[];
  updated: string | null; // already formatted
}

function CategoryCard({ summary }: { summary: CategorySummary }) {
  const { category: c } = summary;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(c.name);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>) => start(async () => {
    try { setError(""); await fn(); } catch (e) { setError(String((e as Error).message ?? e)); }
  });
  const rename = () => {
    setRenaming(false);
    if (name.trim() && name.trim() !== c.name) run(() => updateCategory(c.id, { name }));
    else setName(c.name);
  };

  return (
    <article className={`card relative flex flex-col p-5 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="relative">
          <button onClick={() => setPalette(!palette)} title="Change colour" aria-label={`Change colour of ${c.name}`} className="mt-1 h-4 w-4 rounded-full ring-offset-2 hover:ring-2 hover:ring-black/20 dark:hover:ring-white/30" style={{ background: c.color }} />
          {palette && <ColorPalette value={c.color} onPick={(color) => run(() => updateCategory(c.id, { color }))} onClose={() => setPalette(false)} />}
        </div>
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input
              autoFocus
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") { setName(c.name); setRenaming(false); } }}
              aria-label="Category name"
              className="bordered w-full rounded-md border bg-transparent px-2 py-0.5 font-semibold"
            />
          ) : (
            <Link href={`/categories/${c.id}`} className="block truncate font-semibold hover:underline">{c.name}</Link>
          )}
          <p className="muted text-xs">{summary.count} highlight{summary.count === 1 ? "" : "s"}{summary.updated ? ` · ${summary.updated}` : ""}</p>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(!menu)} aria-label={`More actions for ${c.name}`} aria-haspopup="menu" aria-expanded={menu} className="muted rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
          {menu && (
            <div role="menu" className="bordered panel absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border p-1 text-sm shadow-lg" onMouseLeave={() => setMenu(false)}>
              <button role="menuitem" onClick={() => { setMenu(false); setRenaming(true); }} className="w-full rounded-md px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10">Rename</button>
              <button role="menuitem" onClick={() => { setMenu(false); setPalette(true); }} className="w-full rounded-md px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10">Change colour</button>
              <a role="menuitem" href={`/api/export?category=${c.id}`} className="block rounded-md px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10">Export Markdown</a>
              <button
                role="menuitem"
                onClick={() => { setMenu(false); if (confirm(`Delete “${c.name}”? Its highlights are kept and become uncategorised.`)) run(() => deleteCategory(c.id)); }}
                className="w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-black/5 dark:text-red-400 dark:hover:bg-white/10"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <Link href={`/categories/${c.id}`} className="mt-4 block flex-1 space-y-2">
        {summary.previews.length ? summary.previews.map((p, i) => (
          <p key={i} className="line-clamp-2 border-l-2 pl-2 text-sm" style={{ borderColor: c.color }}>“{p}”</p>
        )) : <p className="muted text-sm">No highlights yet. Add one with the 🏷 button on any highlight.</p>}
      </Link>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </article>
  );
}

export function CategoryBoard({ summaries, uncategorised }: { summaries: CategorySummary[]; uncategorised: { count: number; previews: string[] } }) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const create = () => {
    if (!name.trim()) { setCreating(false); return; }
    start(async () => {
      try { await createCategory(name); setName(""); setCreating(false); setError(""); }
      catch (e) { setError(String((e as Error).message ?? e)); }
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {summaries.map((s) => <CategoryCard key={s.category.id} summary={s} />)}

      <Link href="/categories/uncategorised" className="card flex flex-col p-5">
        <div className="flex items-center gap-3">
          <Dot color={UNCATEGORISED_COLOR} hollow className="h-4 w-4" />
          <div>
            <p className="font-semibold">Uncategorised</p>
            <p className="muted text-xs">{uncategorised.count} highlight{uncategorised.count === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {uncategorised.previews.map((p, i) => <p key={i} className="line-clamp-2 border-l-2 border-[var(--accent)] pl-2 text-sm">“{p}”</p>)}
        </div>
      </Link>

      <div className={`card flex min-h-[140px] flex-col items-center justify-center border-dashed p-5 ${pending ? "opacity-60" : ""}`}>
        {creating ? (
          <div className="w-full">
            <input
              autoFocus
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              onBlur={create}
              onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") { setName(""); setCreating(false); } }}
              placeholder="Category name"
              aria-label="New category name"
              className="bordered w-full rounded-lg border bg-transparent px-3 py-2"
            />
            <p className="muted mt-2 text-xs">A colour is picked for you. Change it any time.</p>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        ) : (
          <button onClick={() => setCreating(true)} className="muted flex flex-col items-center gap-1 text-sm hover:text-[var(--text)]">
            <span className="text-2xl leading-none">+</span>New category
          </button>
        )}
      </div>
    </div>
  );
}

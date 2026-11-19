"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { highlightFill, type Category } from "@highlight/shared";
import { createCategory, deleteCategory, updateCategory } from "@/app/actions";
import { ColorPalette } from "./category-picker";

export interface CategorySummary {
  category: Category;
  count: number;
  previews: string[];
  updated: string | null; // already formatted
}

const TagIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
);

const Chevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition group-hover:translate-x-0.5" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
);

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
  const menuRow = "w-full rounded-md px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10";

  return (
    <article className={`card group relative flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg ${pending ? "opacity-60" : ""}`}>
      <div className="relative flex items-center gap-3 rounded-t-[inherit] px-5 pb-4 pt-5" style={{ background: highlightFill(c.color) }}>
        <div className="relative">
          <button
            onClick={() => setPalette(!palette)}
            title="Change colour"
            aria-label={`Change colour of ${c.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition hover:scale-105"
            style={{ background: c.color }}
          >
            <TagIcon />
          </button>
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
              className="bordered w-full rounded-md border bg-[var(--card)] px-2 py-0.5 text-lg font-semibold"
            />
          ) : (
            <Link href={`/categories/${c.id}`} className="block truncate text-lg font-semibold hover:underline">{c.name}</Link>
          )}
          <p className="text-xs opacity-80">
            <span className="font-semibold">{summary.count}</span> highlight{summary.count === 1 ? "" : "s"}
            {summary.updated ? ` · last added ${summary.updated}` : ""}
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            aria-label={`More actions for ${c.name}`}
            aria-haspopup="menu"
            aria-expanded={menu}
            className="rounded-full p-1.5 opacity-70 hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
          </button>
          {menu && (
            <div role="menu" className="bordered panel absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border p-1 text-sm shadow-lg" onMouseLeave={() => setMenu(false)}>
              <button role="menuitem" onClick={() => { setMenu(false); setRenaming(true); }} className={menuRow}>Rename</button>
              <button role="menuitem" onClick={() => { setMenu(false); setPalette(true); }} className={menuRow}>Change colour</button>
              <a role="menuitem" href={`/api/export?category=${c.id}`} className={`block ${menuRow}`}>Export as Markdown</a>
              <div className="bordered my-1 border-t" />
              <button
                role="menuitem"
                onClick={() => { setMenu(false); if (confirm(`Delete “${c.name}”? Its highlights are kept and become uncategorised.`)) run(() => deleteCategory(c.id)); }}
                className={`${menuRow} text-red-600 dark:text-red-400`}
              >
                Delete category
              </button>
            </div>
          )}
        </div>
      </div>

      <Link href={`/categories/${c.id}`} className="flex flex-1 flex-col px-5 pb-4 pt-4">
        {summary.previews.length ? (
          <div className="flex-1 space-y-2.5">
            {summary.previews.map((p, i) => (
              <p key={i} className="line-clamp-2 text-sm leading-relaxed">
                <span className="rounded-sm px-0.5 [box-decoration-break:clone]" style={{ background: highlightFill(c.color) }}>{p}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="muted flex-1 text-sm">Empty for now. Use the 🏷 button on any highlight, or Category in the extension toolbar, to add one here.</p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium" style={{ color: c.color }}>
          View all <Chevron />
        </span>
      </Link>
      {error && <p className="px-5 pb-3 text-xs text-red-600">{error}</p>}
    </article>
  );
}

/** Inline "create category" control, used in the header and the empty state. */
function NewCategory({ big = false }: { big?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const create = () => {
    if (!name.trim()) { setOpen(false); return; }
    start(async () => {
      try { await createCategory(name); setName(""); setOpen(false); setError(""); }
      catch (e) { setError(String((e as Error).message ?? e)); }
    });
  };
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-full bg-[var(--accent)] font-medium text-black shadow-sm hover:brightness-105 ${big ? "px-5 py-2.5" : "px-4 py-2 text-sm"}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        New category
      </button>
    );
  }
  return (
    <div className={`flex flex-col gap-1 ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") { setName(""); setOpen(false); } }}
          placeholder="e.g. Research, Recipes, Thesis"
          aria-label="New category name"
          className="bordered w-56 rounded-full border bg-transparent px-4 py-2 text-sm focus:border-[var(--accent)]"
        />
        <button onClick={create} disabled={pending} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black">
          {pending ? "Creating…" : "Create"}
        </button>
        <button onClick={() => { setName(""); setOpen(false); }} className="muted px-2 py-2 text-sm">Cancel</button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : <p className="muted pl-4 text-xs">A colour is picked for you. Change it any time.</p>}
    </div>
  );
}

export function CategoryBoard({ summaries, uncategorised }: { summaries: CategorySummary[]; uncategorised: { count: number; previews: string[] } }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="muted text-xs font-medium uppercase tracking-wider">Library</p>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="muted mt-1 text-sm">Group highlights by topic or project. A highlight can be in several; its first category sets its colour.</p>
        </div>
        {summaries.length > 0 && <NewCategory />}
      </div>

      {uncategorised.count > 0 && (
        <Link href="/categories/uncategorised" className="card group mb-6 flex items-center gap-4 p-4 transition hover:shadow-md">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--mark)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" /></svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{uncategorised.count} highlight{uncategorised.count === 1 ? "" : "s"} to sort</p>
            <p className="muted truncate text-sm">{uncategorised.previews[0] ? `Latest: “${uncategorised.previews[0]}”` : "Not in any category yet."}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium">Sort now <Chevron /></span>
        </Link>
      )}

      {summaries.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <div className="mb-4 flex gap-2" aria-hidden="true">
            {["#34a853", "#4285f4", "#e8608c"].map((c) => <span key={c} className="h-4 w-4 rounded-full" style={{ background: c }} />)}
          </div>
          <h2 className="text-lg font-semibold">Create your first category</h2>
          <p className="muted mx-auto mb-6 mt-1 max-w-md text-sm">
            Categories are colour-coded groups like Research, Work or Recipes. Highlights in a category show up in its colour on the page.
          </p>
          <NewCategory big />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => <CategoryCard key={s.category.id} summary={s} />)}
        </div>
      )}
    </div>
  );
}

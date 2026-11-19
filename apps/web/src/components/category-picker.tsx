"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { byRecent, isHexColor, PALETTE, type Category } from "@highlight/shared";
import { createCategory, setHighlightCategories } from "@/app/actions";

/** Close a popover on outside click or Escape. */
export function useDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [ref, onClose]);
}

export function Dot({ color, hollow = false, className = "" }: { color: string; hollow?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={hollow ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : { background: color, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)" }}
    />
  );
}

/**
 * Search, tick and create categories for one highlight. Every change saves immediately.
 * `onChange` lets the card update optimistically.
 */
export function CategoryPicker(props: {
  highlightId: string;
  selected: string[];
  categories: Category[];
  onChange: (ids: string[], created?: Category) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, props.onClose);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [chosen, setChosen] = useState(new Set(props.selected));
  const [error, setError] = useState("");
  const [creating, setCreating] = useState("");
  const sorted = useMemo(() => [...props.categories].sort(byRecent), [props.categories]);
  const matches = sorted.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  const canCreate = !!q.trim() && !sorted.some((c) => c.name.toLowerCase() === q.trim().toLowerCase());
  const rows = matches.length + (canCreate ? 1 : 0);

  const commit = (next: Set<string>, created?: Category) => {
    setChosen(next);
    props.onChange([...next], created);
    setHighlightCategories(props.highlightId, [...next]).catch((e) => setError(String(e.message ?? e)));
  };
  const toggle = (id: string) => {
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id); else next.add(id);
    commit(next);
  };
  const create = async () => {
    const name = q.trim();
    if (!name || creating) return;
    setCreating(name);
    setQ("");
    setError("");
    try {
      const c = await createCategory(name);
      commit(new Set(chosen).add(c.id), c);
    } catch (e) {
      setQ(name);
      setError(String((e as Error).message ?? e));
    } finally {
      setCreating("");
    }
  };
  const run = (i: number) => (i < matches.length ? toggle(matches[i].id) : void create());

  return (
    <div ref={ref} role="dialog" aria-label="Choose categories" className="bordered panel absolute bottom-full right-0 z-20 mb-2 w-64 rounded-xl border p-2 text-left shadow-lg">
      <input
        autoFocus
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { setActive((a) => Math.min(a + 1, rows - 1)); e.preventDefault(); }
          if (e.key === "ArrowUp") { setActive((a) => Math.max(a - 1, 0)); e.preventDefault(); }
          if (e.key === "Enter") { e.preventDefault(); if (rows) run(active); }
        }}
        placeholder={sorted.length ? "Search or create a category" : "Name your first category"}
        aria-label="Search or create a category"
        className="bordered mb-1.5 w-full rounded-lg border bg-transparent px-2.5 py-1.5 text-sm focus:border-[var(--accent)]"
      />
      <div role="listbox" className="max-h-60 overflow-y-auto">
        {matches.map((c, i) => (
          <button
            key={c.id}
            role="option"
            aria-selected={chosen.has(c.id)}
            onClick={() => toggle(c.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 ${i === active ? "bg-black/5 dark:bg-white/10" : ""}`}
          >
            <Dot color={c.color} />
            <span className="min-w-0 flex-1 truncate text-left">{c.name}</span>
            <span className="w-4 font-bold">{chosen.has(c.id) ? "✓" : ""}</span>
          </button>
        ))}
        {canCreate && (
          <button
            onClick={() => void create()}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-amber-700 hover:bg-black/5 dark:text-[var(--accent)] dark:hover:bg-white/10 ${active === matches.length ? "bg-black/5 dark:bg-white/10" : ""}`}
          >
            <span className="w-2.5 text-center">+</span>
            <span className="truncate">Create “{q.trim()}”</span>
          </button>
        )}
        {creating && (
          <div role="status" className="flex items-center gap-2 px-2 py-1.5 text-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span className="muted truncate">Creating “{creating}”…</span>
          </div>
        )}
        {!rows && !creating && <p className="muted px-2 py-1.5 text-xs">Type a name to create a category.</p>}
      </div>
      {error && <p className="mt-1 px-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Seven preset colours plus a custom colour picker. */
export function ColorPalette(props: { value: string; onPick: (color: string) => void; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, props.onClose);
  const [hex, setHex] = useState(props.value);
  const apply = (v: string) => { if (isHexColor(v)) { props.onPick(v.toLowerCase()); props.onClose(); } };
  return (
    <div ref={ref} role="dialog" aria-label="Choose a colour" className={`bordered panel absolute z-20 w-56 rounded-xl border p-3 shadow-lg ${props.className ?? "left-0 top-full mt-2"}`}>
      <div className="grid grid-cols-4 gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => apply(c)}
            aria-label={`Colour ${c}`}
            aria-pressed={c === props.value.toLowerCase()}
            className={`aspect-square rounded-full border-2 ${c === props.value.toLowerCase() ? "border-current" : "border-transparent"}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input type="color" value={isHexColor(hex) ? hex : PALETTE[0]} onChange={(e) => setHex(e.target.value)} onBlur={() => apply(hex)} aria-label="Custom colour" className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply(hex); }}
          maxLength={7}
          aria-label="Hex colour"
          className="bordered w-full rounded-md border bg-transparent px-2 py-1 font-mono text-sm"
        />
        <button onClick={() => apply(hex)} className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-sm font-medium text-black">Set</button>
      </div>
    </div>
  );
}

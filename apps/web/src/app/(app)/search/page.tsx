import Link from "next/link";
import { categoriesOf, formatDay, localDay, type SearchResult } from "@highlight/shared";
import { getCategories, requireUser } from "@/lib/supabase/server";
import { Dot } from "@/components/category-picker";

function snippet(text: string, q: string, len = 220): string {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0 || text.length <= len) return text.length > len ? text.slice(0, len) + "…" : text;
  const start = Math.max(0, i - 60);
  return (start > 0 ? "…" : "") + text.slice(start, start + len) + (start + len < text.length ? "…" : "");
}

function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return <>{parts.map((p, i) => (p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="mark text-inherit">{p}</mark> : p))}</>;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const c = sp.c ?? "";
  const { supabase, profile } = await requireUser();
  const categories = await getCategories(supabase);
  let all: SearchResult[] = [];
  if (q) {
    const { data } = await supabase.rpc("search_content", { q });
    all = (data ?? []) as SearchResult[];
  }
  // Category filter: only highlights in that category (or with none).
  const results = !c ? all : all.filter((r) => r.kind === "highlight" && (c === "none" ? !categoriesOf(r, categories).length : (r.category_ids ?? []).includes(c)));
  const used = categories.filter((cat) => all.some((r) => (r.category_ids ?? []).includes(cat.id)));
  const chip = (value: string, label: React.ReactNode, active: boolean) => (
    <Link
      key={value || "all"}
      href={`/search?q=${encodeURIComponent(q)}${value ? `&c=${value}` : ""}`}
      aria-current={active ? "true" : undefined}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${active ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]" : "bordered hover:bg-black/5 dark:hover:bg-white/5"}`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/day/today" className="muted mb-3 inline-flex items-center gap-1 text-sm hover:underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        Back to Today
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">Search</h1>
      <p className="muted mb-6 text-sm">{q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type in the search box to find highlights and notes."}</p>
      {q && used.length > 0 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          {chip("", "All", !c)}
          {used.map((cat) => chip(cat.id, <><Dot color={cat.color} />{cat.name}</>, c === cat.id))}
          {chip("none", "Uncategorised", c === "none")}
        </div>
      )}
      <ul className="space-y-3">
        {results.map((r) => {
          const day = localDay(r.created_at, profile.timezone);
          const anchor = `${r.kind === "highlight" ? "h" : "n"}-${r.id}`;
          return (
            <li key={anchor}>
              <Link href={`/day/${day}#${anchor}`} className="card block p-4">
                <div className="muted mb-1 flex flex-wrap gap-x-2 text-xs">
                  <span className="font-medium">{r.kind === "highlight" ? r.domain : "Personal note"}</span>
                  <span>· {formatDay(day)}</span>
                </div>
                {r.title && <div className="mb-1 text-sm font-semibold"><Mark text={r.title} q={q} /></div>}
                <p className={`text-sm ${r.kind === "highlight" ? "border-l-4 border-[var(--accent)] pl-3" : ""}`}>
                  <Mark text={snippet(r.body, q)} q={q} />
                </p>
                {r.note && <p className="muted mt-2 text-sm"><Mark text={snippet(r.note, q, 160)} q={q} /></p>}
                {categoriesOf(r, categories).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {categoriesOf(r, categories).map((cat) => (
                      <span key={cat.id} className="bordered inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs"><Dot color={cat.color} />{cat.name}</span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

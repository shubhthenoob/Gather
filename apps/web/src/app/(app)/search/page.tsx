import Link from "next/link";
import { formatDay, localDay, type SearchResult } from "@highlight/shared";
import { requireUser } from "@/lib/supabase/server";

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

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const { supabase, profile } = await requireUser();
  let results: SearchResult[] = [];
  if (q) {
    const { data } = await supabase.rpc("search_content", { q });
    results = (data ?? []) as SearchResult[];
  }
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold">Search</h1>
      <p className="muted mb-6 text-sm">{q ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q}”` : "Type in the search box to find highlights and notes."}</p>
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
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

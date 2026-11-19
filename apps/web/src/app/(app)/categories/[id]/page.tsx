import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categoriesOf, UNCATEGORISED_COLOR, type Highlight } from "@highlight/shared";
import { getCategories, requireUser } from "@/lib/supabase/server";
import { HighlightCard } from "@/components/highlight-card";
import { Dot } from "@/components/category-picker";

export const metadata: Metadata = { title: "Category · Gather" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireUser();
  const categories = await getCategories(supabase);
  const uncategorised = id === "uncategorised";
  const category = categories.find((c) => c.id === id);
  if (!uncategorised && !category) notFound();

  let query = supabase.from("highlights").select("*").order("created_at", { ascending: false }).limit(1000);
  if (category) query = query.contains("category_ids", [category.id]);
  const { data } = await query;
  let highlights = (data ?? []) as Highlight[];
  if (uncategorised) highlights = highlights.filter((h) => !categoriesOf(h, categories).length);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/categories" className="muted mb-3 inline-flex items-center gap-1 text-sm hover:underline">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        All categories
      </Link>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Dot color={category?.color ?? UNCATEGORISED_COLOR} hollow={uncategorised} className="h-4 w-4" />
          <div>
            <h1 className="text-2xl font-semibold">{category?.name ?? "Uncategorised"}</h1>
            <p className="muted text-sm">{highlights.length} highlight{highlights.length === 1 ? "" : "s"}</p>
          </div>
        </div>
        {category && highlights.length > 0 && (
          <a href={`/api/export?category=${category.id}`} className="bordered rounded-full border px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">Export Markdown</a>
        )}
      </header>
      {highlights.length === 0 ? (
        <div className="muted card p-10 text-center text-sm">
          {uncategorised ? "Every highlight has a category. Nice and tidy." : "No highlights here yet. Use the 🏷 button on any highlight to add it."}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {highlights.map((h) => <HighlightCard key={h.id} highlight={h} timezone={profile.timezone} categories={categories} />)}
        </div>
      )}
    </div>
  );
}

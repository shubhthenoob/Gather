import type { Metadata } from "next";
import { categoriesOf, formatDay, localDay, type Highlight } from "@highlight/shared";
import { getCategories, requireUser } from "@/lib/supabase/server";
import { CategoryBoard, type CategorySummary } from "@/components/category-board";

export const metadata: Metadata = { title: "Categories · Gather" };

export default async function CategoriesPage() {
  const { supabase, profile } = await requireUser();
  const [categories, h] = await Promise.all([
    getCategories(supabase),
    supabase.from("highlights").select("id,selected_text,category_ids,created_at").order("created_at", { ascending: false }).limit(5000),
  ]);
  const highlights = (h.data ?? []) as Pick<Highlight, "id" | "selected_text" | "category_ids" | "created_at">[];

  // Busiest categories first.
  const summaries: CategorySummary[] = categories.map((category) => {
    const inCat = highlights.filter((x) => x.category_ids?.includes(category.id));
    return {
      category,
      count: inCat.length,
      previews: inCat.slice(0, 3).map((x) => x.selected_text.slice(0, 160)),
      updated: inCat[0] ? formatDay(localDay(inCat[0].created_at, profile.timezone)) : null,
    };
  }).sort((a, b) => b.count - a.count || a.category.name.localeCompare(b.category.name));
  const uncat = highlights.filter((x) => !categoriesOf(x, categories).length);

  return (
    <div className="mx-auto max-w-5xl">
      {h.error ? (
        <div className="card p-6 text-sm"><h1 className="mb-2 text-2xl font-semibold">Categories</h1>Categories aren&apos;t set up yet. Run the latest database migration, then reload this page.</div>
      ) : (
        <CategoryBoard summaries={summaries} uncategorised={{ count: uncat.length, previews: uncat.slice(0, 3).map((x) => x.selected_text.slice(0, 160)) }} />
      )}
    </div>
  );
}

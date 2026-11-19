import Link from "next/link";
import { notFound } from "next/navigation";
import { categoriesOf, UNCATEGORISED_COLOR, type Highlight } from "@highlight/shared";
import { getCategories, requireUser } from "@/lib/supabase/server";
import { HighlightCard } from "./highlight-card";
import { Dot } from "./category-picker";
import { CategoryControls, NewCategory } from "./category-board";

/**
 * Highlights as content cards, filtered by category.
 * `selected` is "all", "uncategorised" or a category id.
 */
export async function CategoryView({ selected }: { selected: string }) {
  const { supabase, profile } = await requireUser();
  const categories = await getCategories(supabase);
  const category = categories.find((c) => c.id === selected);
  if (selected !== "all" && selected !== "uncategorised" && !category) notFound();

  // Counts for the chips (ids only), and the cards to show.
  const [{ data: idRows }, { data }] = await Promise.all([
    supabase.from("highlights").select("category_ids").limit(5000),
    (() => {
      let q = supabase.from("highlights").select("*").order("created_at", { ascending: false }).limit(500);
      if (category) q = q.contains("category_ids", [category.id]);
      return q;
    })(),
  ]);
  const ids = (idRows ?? []) as Pick<Highlight, "category_ids">[];
  const counts = new Map<string, number>();
  let uncatCount = 0;
  for (const r of ids) {
    const cats = categoriesOf(r, categories);
    if (!cats.length) uncatCount++;
    for (const c of cats) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  }
  let highlights = (data ?? []) as Highlight[];
  if (selected === "uncategorised") highlights = highlights.filter((h) => !categoriesOf(h, categories).length);

  const chip = (href: string, label: React.ReactNode, active: boolean, count?: number) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-[var(--text)] bg-[var(--text)] text-[var(--bg)]" : "bordered hover:bg-black/5 dark:hover:bg-white/5"}`}
    >
      {label}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </Link>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-semibold">Categories</h1>

      <nav aria-label="Categories" className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {chip("/categories", "All", selected === "all", ids.length)}
        {categories.map((c) => chip(`/categories/${c.id}`, <><Dot color={c.color} />{c.name}</>, selected === c.id, counts.get(c.id) ?? 0))}
        {chip("/categories/uncategorised", <><Dot color={UNCATEGORISED_COLOR} hollow />Uncategorised</>, selected === "uncategorised", uncatCount)}
        <NewCategory />
      </nav>

      {category && <CategoryControls category={category} count={counts.get(category.id) ?? 0} />}
      {selected === "uncategorised" && (
        <p className="muted mb-5 text-sm">Highlights without a category. Use the 🏷 button on a card to file it.</p>
      )}

      {highlights.length === 0 ? (
        <div className="muted card p-10 text-center text-sm">
          {selected === "uncategorised"
            ? "Every highlight has a category. Nice and tidy."
            : category
              ? "No highlights here yet. Use the 🏷 button on any highlight, or Category in the extension toolbar, to add one."
              : "Nothing saved yet. Select text on any page and click Save."}
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {highlights.map((h) => <HighlightCard key={h.id} highlight={h} timezone={profile.timezone} categories={categories} />)}
        </div>
      )}
    </div>
  );
}

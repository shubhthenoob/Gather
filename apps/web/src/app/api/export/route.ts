import { NextResponse } from "next/server";
import { dayBounds, isValidDay, toMarkdown, type Category, type Highlight, type Note } from "@highlight/shared";
import { createClient } from "@/lib/supabase/server";

const PAGE = 1000;

async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("timezone").eq("id", user.id).single();
  const tz = profile?.timezone ?? "UTC";
  const params = new URL(request.url).searchParams;
  const day = params.get("day");
  const categoryId = params.get("category");
  const { data: cats } = await supabase.from("categories").select("*");
  const categories = (cats ?? []) as Category[];
  const category = categoryId ? categories.find((c) => c.id === categoryId) : undefined;
  if (categoryId && !category) return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  if (day && !isValidDay(day)) return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  const bounds = day ? dayBounds(day, tz) : null;

  const highlights = await fetchAll<Highlight>((a, b) => {
    let q = supabase.from("highlights").select("*").order("created_at").range(a, b);
    if (bounds) q = q.gte("created_at", bounds.start).lt("created_at", bounds.end);
    if (category) q = q.contains("category_ids", [category.id]);
    return q;
  });
  // A category export contains only that category's highlights, no personal notes.
  const notes = category ? [] : await fetchAll<Note>((a, b) => {
    let q = supabase.from("notes").select("*").order("created_at").range(a, b);
    if (bounds) q = q.gte("created_at", bounds.start).lt("created_at", bounds.end);
    return q;
  });
  const md = toMarkdown(highlights, notes, tz, categories);
  const slug = category?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "category";
  const filename = category ? `gather-${slug}.md` : day ? `gather-${day}.md` : `gather-export-${new Date().toISOString().slice(0, 10)}.md`;
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

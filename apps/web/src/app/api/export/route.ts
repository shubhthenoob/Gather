import { NextResponse } from "next/server";
import { dayBounds, isValidDay, toMarkdown, type Highlight, type Note } from "@highlight/shared";
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
  const day = new URL(request.url).searchParams.get("day");
  if (day && !isValidDay(day)) return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  const bounds = day ? dayBounds(day, tz) : null;

  const highlights = await fetchAll<Highlight>((a, b) => {
    let q = supabase.from("highlights").select("*").order("created_at").range(a, b);
    if (bounds) q = q.gte("created_at", bounds.start).lt("created_at", bounds.end);
    return q;
  });
  const notes = await fetchAll<Note>((a, b) => {
    let q = supabase.from("notes").select("*").order("created_at").range(a, b);
    if (bounds) q = q.gte("created_at", bounds.start).lt("created_at", bounds.end);
    return q;
  });

  const md = toMarkdown(highlights, notes, tz);
  const filename = day ? `gather-${day}.md` : `gather-export-${new Date().toISOString().slice(0, 10)}.md`;
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

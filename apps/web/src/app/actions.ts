"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isHexColor, isValidTimeZone, nextColor, type Category } from "@highlight/shared";
import { createClient } from "@/lib/supabase/server";

// RLS guarantees ownership; every query below still runs as the signed-in user.

async function authed() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

function done(error: { message: string } | null) {
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function updateHighlightNote(id: string, note: string) {
  const { supabase } = await authed();
  const { error } = await supabase.from("highlights").update({ note: note.trim() || null }).eq("id", id);
  done(error);
}

export async function deleteHighlight(id: string) {
  const { supabase } = await authed();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  done(error);
}

export async function setHighlightCategories(id: string, categoryIds: string[]) {
  const { supabase } = await authed();
  const ids = [...new Set(categoryIds)];
  const { error } = await supabase.from("highlights").update({ category_ids: ids }).eq("id", id);
  if (!error && ids.length) await supabase.from("categories").update({ last_used_at: new Date().toISOString() }).in("id", ids);
  done(error);
}

export async function createCategory(name: string, color?: string): Promise<Category> {
  const { supabase } = await authed();
  const clean = name.trim().slice(0, 60);
  if (!clean) throw new Error("Give the category a name.");
  const { data: existing } = await supabase.from("categories").select("*");
  const all = (existing ?? []) as Category[];
  const same = all.find((c) => c.name.trim().toLowerCase() === clean.toLowerCase());
  if (same) return same;
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: clean, color: color && isHexColor(color) ? color.toLowerCase() : nextColor(all) })
    .select("*").single();
  done(error);
  return data as Category;
}

export async function updateCategory(id: string, patch: { name?: string; color?: string }) {
  const { supabase } = await authed();
  const clean: { name?: string; color?: string } = {};
  if (patch.name !== undefined) {
    clean.name = patch.name.trim().slice(0, 60);
    if (!clean.name) throw new Error("Give the category a name.");
  }
  if (patch.color !== undefined) {
    if (!isHexColor(patch.color)) throw new Error("Invalid colour");
    clean.color = patch.color.toLowerCase();
  }
  const { error } = await supabase.from("categories").update(clean).eq("id", id);
  if (error?.code === "23505") throw new Error("You already have a category with that name.");
  done(error);
}

/** Highlights are kept: a database trigger removes the category from them. */
export async function deleteCategory(id: string) {
  const { supabase } = await authed();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  done(error);
}

export async function createNote(): Promise<string> {
  const { supabase, user } = await authed();
  const { data, error } = await supabase.from("notes").insert({ user_id: user.id, content: "" }).select("id").single();
  done(error);
  return data!.id;
}

export async function updateNote(id: string, fields: { title?: string | null; content?: string }) {
  const { supabase } = await authed();
  const patch: Record<string, string | null> = {};
  if (fields.title !== undefined) patch.title = fields.title?.trim() || null;
  if (fields.content !== undefined) patch.content = fields.content;
  const { error } = await supabase.from("notes").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  // No revalidate on keystroke autosave; the editor owns its state.
}

export async function deleteNote(id: string) {
  const { supabase } = await authed();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  done(error);
}

export async function setTimezone(formData: FormData) {
  const tz = String(formData.get("timezone") ?? "");
  if (!isValidTimeZone(tz)) throw new Error("Invalid timezone");
  const { supabase, user } = await authed();
  const { error } = await supabase.from("users").update({ timezone: tz }).eq("id", user.id);
  done(error);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" }); // keep the extension signed in
  redirect("/login");
}

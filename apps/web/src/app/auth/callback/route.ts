import { NextResponse } from "next/server";
import { isValidTimeZone } from "@highlight/shared";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tz = url.searchParams.get("tz");
  if (!code) return NextResponse.redirect(new URL("/login?error=1", url.origin));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/login?error=1", url.origin));

  // Adopt the browser timezone on first sign-in only; afterwards Settings owns it.
  if (tz && isValidTimeZone(tz)) {
    await supabase.from("users").update({ timezone: tz }).eq("id", data.user.id).eq("timezone", "UTC");
  }
  return NextResponse.redirect(new URL("/", url.origin));
}

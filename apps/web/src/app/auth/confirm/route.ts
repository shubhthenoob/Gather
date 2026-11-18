import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Signs the website in with a one-time token from the Gather extension, then continues to `next`. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const nextParam = url.searchParams.get("next") ?? "/day/today";
  // Only same-site paths, never an absolute URL.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/day/today";
  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (error) return NextResponse.redirect(new URL("/login?error=1", url.origin));
  }
  return NextResponse.redirect(new URL(next, url.origin));
}

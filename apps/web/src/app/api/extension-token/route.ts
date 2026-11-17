import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Hands the Gather extension a one-time sign-in token for the user who is signed in on the website,
 * so they don't have to sign in twice. The extension redeems it for its own, independent session
 * (sharing the website's refresh token would trip Supabase's token-reuse protection).
 */
export async function POST(request: NextRequest) {
  // Only our own pages may ask (the browser always sets Origin on POST fetches).
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "not configured" }, { status: 501 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: "could not create token" }, { status: 500 });
  }
  return NextResponse.json(
    { token_hash: data.properties.hashed_token, email: user.email },
    { headers: { "Cache-Control": "no-store" } },
  );
}

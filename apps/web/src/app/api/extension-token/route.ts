import { NextResponse, type NextRequest } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * Hands the Gather extension a one-time sign-in token for the user who is signed in on the website,
 * so they don't have to sign in twice. The extension redeems it for its own, independent session
 * (sharing the website's refresh token would trip Supabase's token-reuse protection).
 */
const EXTENSION_ORIGINS = [
  "chrome-extension://mjnohkfaifggignaafjmdkhcncloogho", // Chrome Web Store
  "chrome-extension://mfahadeaanmcngjbgblpgfmefmlddcjm", // local development build
];

export async function POST(request: NextRequest) {
  // Only our own pages or the Gather extension may ask (browsers always set Origin on POST fetches).
  const origin = request.headers.get("origin");
  if (origin !== request.nextUrl.origin && !EXTENSION_ORIGINS.includes(origin ?? "")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "not configured" }, { status: 501 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Read the website's access token without refreshing it. A refresh here would rotate the refresh
  // token, and the browser may not store the new cookie for an extension request, which would later
  // look like token reuse and sign the user out of the website.
  const websiteToken = readAccessToken(request);
  const websiteUser = websiteToken ? (await admin.auth.getUser(websiteToken)).data.user : null;

  // The other direction: the extension is signed in and wants the website signed in too.
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  let user = websiteUser;
  if (bearer) {
    const extUser = (await admin.auth.getUser(bearer)).data.user;
    if (!extUser?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (websiteUser?.id === extUser.id) return NextResponse.json({ signedIn: true }, { headers: { "Cache-Control": "no-store" } });
    user = extUser;
  }
  if (!user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: user.email });
  if (error || !data.properties?.hashed_token) {
    return NextResponse.json({ error: "could not create token" }, { status: 500 });
  }
  return NextResponse.json(
    { token_hash: data.properties.hashed_token, email: user.email },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Reassembles the @supabase/ssr auth cookie (possibly split into .0, .1 chunks) and returns its access token. */
function readAccessToken(request: NextRequest): string | null {
  const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  let raw = request.cookies.get(name)?.value;
  if (!raw) {
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const c = request.cookies.get(`${name}.${i}`)?.value;
      if (c === undefined) break;
      chunks.push(c);
    }
    raw = chunks.join("") || undefined;
  }
  if (!raw) return null;
  try {
    const json = raw.startsWith("base64-") ? Buffer.from(raw.slice(7), "base64url").toString("utf8") : decodeURIComponent(raw);
    const token = (JSON.parse(json) as { access_token?: unknown }).access_token;
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

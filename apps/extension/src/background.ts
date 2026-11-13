import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupportedUrl, normalizeText, type Highlight } from "@highlight/shared";
import type { Draft, ListResult, Request, SaveResult, TabMessage, UserInfo } from "./messages";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;

// ---- Supabase client backed by chrome.storage so the session survives worker restarts ----
const storage = {
  getItem: async (k: string) => ((await chrome.storage.local.get(k))[k] as string | undefined) ?? null,
  setItem: async (k: string, v: string) => chrome.storage.local.set({ [k]: v }),
  removeItem: async (k: string) => chrome.storage.local.remove(k),
};

const supabase: SupabaseClient = createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__, {
  auth: { storage, flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

async function currentUser(): Promise<UserInfo | null> {
  const { data } = await supabase.auth.getSession();
  const u = data.session?.user;
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    name: (u.user_metadata?.full_name as string) ?? (u.user_metadata?.name as string) ?? null,
    avatar: (u.user_metadata?.avatar_url as string) ?? null,
  };
}

async function signIn(): Promise<UserInfo | null> {
  const redirectTo = chrome.identity.getRedirectURL();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) throw new Error(error?.message ?? "Could not start sign-in");
  const result = await chrome.identity.launchWebAuthFlow({ url: data.url, interactive: true });
  if (!result) throw new Error("Sign-in was cancelled");
  const code = new URL(result).searchParams.get("code");
  if (!code) throw new Error("No authorisation code returned");
  const { error: xerr } = await supabase.auth.exchangeCodeForSession(code);
  if (xerr) throw new Error(xerr.message);
  const user = await currentUser();
  if (user) {
    // Adopt the browser timezone if the account still has the default.
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from("users").update({ timezone: tz }).eq("id", user.id).eq("timezone", "UTC");
  }
  await broadcast({ type: "refresh" });
  void flushQueue();
  return user;
}

async function broadcast(msg: TabMessage) {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id !== undefined && isSupportedUrl(t.url)) chrome.tabs.sendMessage(t.id, msg).catch(() => {});
  }
}

// ---- Local cache and offline queue ----
type QueueOp =
  | { op: "create"; draft: Draft; at: string }
  | { op: "update"; id: string; note: string | null }
  | { op: "delete"; id: string };

const QUEUE_KEY = "queue";
const cacheKey = (url: string) => `cache:${url}`;

async function getQueue(): Promise<QueueOp[]> {
  return ((await chrome.storage.local.get(QUEUE_KEY))[QUEUE_KEY] as QueueOp[] | undefined) ?? [];
}
async function setQueue(q: QueueOp[]) {
  await chrome.storage.local.set({ [QUEUE_KEY]: q });
}
async function enqueue(op: QueueOp) {
  const q = await getQueue();
  q.push(op);
  await setQueue(q);
}
async function getCache(url: string): Promise<Highlight[]> {
  return ((await chrome.storage.local.get(cacheKey(url)))[cacheKey(url)] as Highlight[] | undefined) ?? [];
}
async function setCache(url: string, hs: Highlight[]) {
  await chrome.storage.local.set({ [cacheKey(url)]: hs });
}
async function patchCache(url: string, fn: (hs: Highlight[]) => Highlight[]) {
  await setCache(url, fn(await getCache(url)));
}

function isNetworkError(e: { message?: string; code?: string } | null): boolean {
  if (!e) return false;
  return !e.code || /fetch|network|Failed to/i.test(e.message ?? "");
}

function draftToHighlight(d: Draft, userId: string, at: string): Highlight {
  return { ...d, user_id: userId, created_at: at, updated_at: at };
}

/** Replay queued writes in order. Stops at the first network failure. */
let flushing = false;
async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    if (!(await currentUser())) return;
    let q = await getQueue();
    while (q.length) {
      const op = q[0];
      let error: { message?: string; code?: string } | null = null;
      if (op.op === "create") {
        ({ error } = await supabase.from("highlights").insert({ ...op.draft, created_at: op.at }));
        if (error?.code === "23505") error = null; // already synced or duplicate
      } else if (op.op === "update") {
        ({ error } = await supabase.from("highlights").update({ note: op.note }).eq("id", op.id));
      } else {
        ({ error } = await supabase.from("highlights").delete().eq("id", op.id));
      }
      if (error && isNetworkError(error)) break;
      // Non-network errors (e.g. validation) are dropped so the queue cannot jam.
      q = q.slice(1);
      await setQueue(q);
    }
    await updateQueueBadge();
  } finally {
    flushing = false;
  }
}

async function updateQueueBadge() {
  const n = (await getQueue()).length;
  if (n) {
    await chrome.action.setBadgeBackgroundColor({ color: "#9aa0a6" });
    await chrome.action.setBadgeText({ text: "…" });
    await chrome.action.setTitle({ title: `Gather: ${n} change${n === 1 ? "" : "s"} waiting to sync` });
  } else {
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: "Gather" });
  }
}

// ---- Handlers ----
async function list(canonicalUrl: string): Promise<ListResult> {
  const user = await currentUser();
  if (!user) return { signedIn: false, highlights: [] };
  const pending = (await getQueue()).filter((o): o is Extract<QueueOp, { op: "create" }> => o.op === "create" && o.draft.canonical_url === canonicalUrl);
  const deleted = new Set((await getQueue()).flatMap((o) => (o.op === "delete" ? [o.id] : [])));
  const { data, error } = await supabase.from("highlights").select("*").eq("canonical_url", canonicalUrl).order("created_at");
  let highlights: Highlight[];
  let offline = false;
  if (error) {
    highlights = await getCache(canonicalUrl);
    offline = true;
  } else {
    highlights = data as Highlight[];
    await setCache(canonicalUrl, highlights);
  }
  const ids = new Set(highlights.map((h) => h.id));
  for (const p of pending) if (!ids.has(p.draft.id)) highlights.push(draftToHighlight(p.draft, user.id, p.at));
  return { signedIn: true, offline, highlights: highlights.filter((h) => !deleted.has(h.id)) };
}

async function save(draft: Draft): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) return { ok: false, needsAuth: true };
  const at = new Date().toISOString();
  const { data, error } = await supabase.from("highlights").insert(draft).select("*").single();
  if (!error) {
    await patchCache(draft.canonical_url, (hs) => [...hs, data as Highlight]);
    void flushQueue();
    return { ok: true, highlight: data as Highlight };
  }
  if (error.code === "23505") {
    // Duplicate: return the existing record so the user can edit it.
    const { data: existing } = await supabase
      .from("highlights").select("*")
      .eq("canonical_url", draft.canonical_url)
      .eq("normalised_text", normalizeText(draft.selected_text))
      .eq("prefix", draft.prefix).eq("suffix", draft.suffix)
      .maybeSingle();
    if (existing) return { ok: true, highlight: existing as Highlight, existing: true };
    return { ok: false, error: "This highlight already exists." };
  }
  if (isNetworkError(error)) {
    await enqueue({ op: "create", draft, at });
    await updateQueueBadge();
    return { ok: true, queued: true, highlight: draftToHighlight(draft, user.id, at) };
  }
  return { ok: false, error: error.message };
}

async function update(id: string, note: string | null): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) return { ok: false, needsAuth: true };
  const { data, error } = await supabase.from("highlights").update({ note }).eq("id", id).select("*").maybeSingle();
  if (!error && data) {
    await patchCache((data as Highlight).canonical_url, (hs) => hs.map((h) => (h.id === id ? (data as Highlight) : h)));
    return { ok: true, highlight: data as Highlight };
  }
  if (error && isNetworkError(error)) {
    const q = await getQueue();
    const pendingCreate = q.find((o) => o.op === "create" && o.draft.id === id) as Extract<QueueOp, { op: "create" }> | undefined;
    if (pendingCreate) pendingCreate.draft.note = note;
    else q.push({ op: "update", id, note });
    await setQueue(q);
    await updateQueueBadge();
    return { ok: true, queued: true, highlight: { id, note } as Highlight };
  }
  // Not found on server: it may still be an unsynced create.
  const q = await getQueue();
  const pendingCreate = q.find((o) => o.op === "create" && o.draft.id === id) as Extract<QueueOp, { op: "create" }> | undefined;
  if (pendingCreate) {
    pendingCreate.draft.note = note;
    await setQueue(q);
    return { ok: true, queued: true, highlight: draftToHighlight(pendingCreate.draft, user.id, pendingCreate.at) };
  }
  return { ok: false, error: error?.message ?? "Highlight not found" };
}

async function remove(id: string): Promise<{ ok: boolean; queued?: boolean }> {
  const q = await getQueue();
  if (q.some((o) => o.op === "create" && o.draft.id === id)) {
    await setQueue(q.filter((o) => !(o.op === "create" && o.draft.id === id) && !(o.op === "update" && o.id === id)));
    return { ok: true };
  }
  const { data: row } = await supabase.from("highlights").select("canonical_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (!error) {
    if (row) await patchCache(row.canonical_url as string, (hs) => hs.filter((h) => h.id !== id));
    return { ok: true };
  }
  if (isNetworkError(error)) {
    await enqueue({ op: "delete", id });
    await updateQueueBadge();
    return { ok: true, queued: true };
  }
  return { ok: false };
}

async function setTabBadge(tabId: number, painted: number, unresolved: number) {
  if ((await getQueue()).length) return; // the sync indicator wins
  await chrome.action.setBadgeBackgroundColor({ tabId, color: unresolved ? "#e37400" : "#f9ab00" });
  await chrome.action.setBadgeText({ tabId, text: painted || unresolved ? String(painted + unresolved) : "" });
  await chrome.action.setTitle({
    tabId,
    title: unresolved
      ? `Gather: ${painted} restored, ${unresolved} could not be found on this page`
      : painted ? `Gather: ${painted} highlight${painted === 1 ? "" : "s"} on this page` : "Gather",
  });
}

async function handle(msg: Request, sender: chrome.runtime.MessageSender): Promise<unknown> {
  switch (msg.type) {
    case "session": return currentUser();
    case "signIn":
      try { return { ok: true, user: await signIn() }; } catch (e) { return { ok: false, error: (e as Error).message }; }
    case "signOut":
      await supabase.auth.signOut();
      await broadcast({ type: "refresh" });
      return { ok: true };
    case "list": return list(msg.canonicalUrl);
    case "save": return save(msg.draft);
    case "update": return update(msg.id, msg.note);
    case "delete": return remove(msg.id);
    case "queueSize": return (await getQueue()).length;
    case "badge":
      if (sender.tab?.id !== undefined) await setTabBadge(sender.tab.id, msg.painted, msg.unresolved);
      return null;
  }
}

chrome.runtime.onMessage.addListener((msg: Request, sender, reply) => {
  handle(msg, sender).then(reply, (e) => reply({ ok: false, error: String(e?.message ?? e) }));
  return true; // async response
});

chrome.alarms.create("sync", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "sync") void flushQueue(); });
chrome.runtime.onStartup.addListener(() => void flushQueue());
chrome.runtime.onInstalled.addListener(() => void flushQueue());

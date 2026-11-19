import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupportedUrl, nextColor, normalizeText, type Category, type Highlight } from "@highlight/shared";
import type {
  CategoryPatch, CategoryResult, Draft, HighlightPatch, ListResult, PanelMessage, Request, SaveResult, TabMessage, UserInfo,
} from "./messages";

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_ANON_KEY__: string;
declare const __WEB_URL__: string;

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

/** Runs after any successful sign-in: upload what was saved while signed out, then sync. */
async function afterSignIn() {
  await uploadLocal().catch(() => { /* kept locally; retried on the next sync */ });
  await changed();
  void flushQueue();
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
  await afterSignIn();
  return user;
}

/** Sign in with a one-time token handed over by the Gather website, so users only sign in once. */
async function adoptSession(tokenHash: string): Promise<{ ok: boolean; user?: UserInfo | null }> {
  const existing = await currentUser();
  if (existing) return { ok: true, user: existing };
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (error) return { ok: false };
  await afterSignIn();
  return { ok: true, user: await currentUser() };
}

/**
 * Ask the Gather website (using its sign-in cookie) for a one-time token, so a user who is already
 * signed in there never has to sign in to the extension. Works without any Gather tab open.
 */
let lastWebTry = 0;
async function signInFromWeb(): Promise<UserInfo | null> {
  if (Date.now() - lastWebTry < 30_000) return null;
  lastWebTry = Date.now();
  try {
    const res = await fetch(`${__WEB_URL__}/api/extension-token`, { method: "POST", credentials: "include", redirect: "manual" });
    if (!res.ok) return null;
    const { token_hash } = (await res.json()) as { token_hash?: string };
    if (!token_hash) return null;
    const r = await adoptSession(token_hash);
    return r.ok ? r.user ?? null : null;
  } catch {
    return null;
  }
}

/** Opens the web library, first signing the website in with the extension's session if needed. */
async function openLibrary() {
  let url = `${__WEB_URL__}/day/today`;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      const res = await fetch(`${__WEB_URL__}/api/extension-token`, {
        method: "POST", credentials: "include", redirect: "manual", headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = (await res.json()) as { token_hash?: string };
        if (body.token_hash) url = `${__WEB_URL__}/auth/confirm?token_hash=${encodeURIComponent(body.token_hash)}&next=/day/today`;
      }
    }
  } catch { /* fall back to the plain library link */ }
  await chrome.tabs.create({ url });
  return null;
}

/** Tells open tabs and the side panel that highlights or categories changed. */
async function changed() {
  const tabs = await chrome.tabs.query({});
  for (const t of tabs) {
    if (t.id !== undefined && isSupportedUrl(t.url)) chrome.tabs.sendMessage(t.id, { type: "refresh" } satisfies TabMessage).catch(() => {});
  }
  chrome.runtime.sendMessage({ type: "changed" } satisfies PanelMessage).catch(() => { /* panel closed */ });
}

// ---- Storage: highlights saved while signed out live on this device until sign-in ----
const LOCAL_H = "local:highlights";
const LOCAL_C = "local:categories";
const CACHE_C = "cache:categories";
const QUEUE_KEY = "queue";
const cacheKey = (url: string) => `cache:${url}`;

async function read<T>(key: string, fallback: T): Promise<T> {
  return ((await chrome.storage.local.get(key))[key] as T | undefined) ?? fallback;
}
async function write(key: string, value: unknown) {
  await chrome.storage.local.set({ [key]: value });
}

const localHighlights = () => read<Highlight[]>(LOCAL_H, []);
const localCategories = () => read<Category[]>(LOCAL_C, []);

// ---- Offline queue (signed in, but the network is down) ----
type QueueOp =
  | { op: "create"; draft: Draft; at: string }
  | { op: "update"; id: string; patch?: HighlightPatch; note?: string | null }
  | { op: "delete"; id: string }
  | { op: "catUpsert"; category: Category }
  | { op: "catDelete"; id: string };

const getQueue = () => read<QueueOp[]>(QUEUE_KEY, []);
const setQueue = (q: QueueOp[]) => write(QUEUE_KEY, q);
async function enqueue(op: QueueOp) {
  const q = await getQueue();
  q.push(op);
  await setQueue(q);
  await updateQueueBadge();
}

async function patchCache(url: string, fn: (hs: Highlight[]) => Highlight[]) {
  await write(cacheKey(url), fn(await read<Highlight[]>(cacheKey(url), [])));
}

function isNetworkError(e: { message?: string; code?: string } | null): boolean {
  if (!e) return false;
  return !e.code || /fetch|network|Failed to/i.test(e.message ?? "");
}

/** Leave out an empty category list so saving still works on a database without categories yet. */
function row<T extends { category_ids?: string[] }>(r: T): T {
  if (r.category_ids && r.category_ids.length) return r;
  const { category_ids: _c, ...rest } = r;
  return rest as T;
}

function draftToHighlight(d: Draft, userId: string, at: string): Highlight {
  return { ...d, category_ids: d.category_ids ?? [], user_id: userId, created_at: at, updated_at: at };
}

/** Replay queued writes in order. Stops at the first network failure. */
let flushing = false;
async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    if (!(await currentUser())) return;
    await uploadLocal().catch(() => {});
    let q = await getQueue();
    while (q.length) {
      const op = q[0];
      let error: { message?: string; code?: string } | null = null;
      if (op.op === "create") {
        ({ error } = await supabase.from("highlights").insert(row({ ...op.draft, created_at: op.at })));
        if (error?.code === "23505") error = null; // already synced or duplicate
      } else if (op.op === "update") {
        ({ error } = await supabase.from("highlights").update(op.patch ?? { note: op.note ?? null }).eq("id", op.id));
      } else if (op.op === "delete") {
        ({ error } = await supabase.from("highlights").delete().eq("id", op.id));
      } else if (op.op === "catUpsert") {
        const { user_id: _u, ...cat } = op.category;
        ({ error } = await supabase.from("categories").upsert(cat));
      } else {
        ({ error } = await supabase.from("categories").delete().eq("id", op.id));
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

/**
 * Upload everything saved while signed out. Categories merge by name (a local "Research" joins an
 * existing "Research"); duplicate highlights are skipped. Local data is cleared only on success.
 */
let uploading = false;
async function uploadLocal() {
  if (uploading) return;
  const [lh, lc] = await Promise.all([localHighlights(), localCategories()]);
  if (!lh.length && !lc.length) return;
  uploading = true;
  try {
    const { data: remote, error } = await supabase.from("categories").select("*");
    if (error) throw error;
    const byName = new Map((remote as Category[]).map((c) => [c.name.trim().toLowerCase(), c.id]));
    const idMap = new Map<string, string>();
    for (const c of lc) {
      const match = byName.get(c.name.trim().toLowerCase());
      if (match) { idMap.set(c.id, match); continue; }
      const { error: e } = await supabase.from("categories").insert({ id: c.id, name: c.name, color: c.color, created_at: c.created_at, last_used_at: c.last_used_at });
      if (e && isNetworkError(e)) throw e;
      idMap.set(c.id, c.id);
    }
    for (const h of lh) {
      const { user_id: _u, updated_at: _t, ...rest } = h;
      const category_ids = (h.category_ids ?? []).map((id) => idMap.get(id)).filter((id): id is string => !!id);
      const { error: e } = await supabase.from("highlights").insert(row({ ...rest, category_ids }));
      if (e && isNetworkError(e)) throw e; // duplicates (23505) and invalid rows are skipped
    }
    await chrome.storage.local.remove([LOCAL_H, LOCAL_C]);
  } finally {
    uploading = false;
  }
}

// ---- Categories ----
async function listCategories(): Promise<Category[]> {
  if (!(await currentUser())) return localCategories();
  const { data, error } = await supabase.from("categories").select("*").order("last_used_at", { ascending: false });
  if (error) return read<Category[]>(CACHE_C, []);
  await write(CACHE_C, data);
  return data as Category[];
}

async function createCategory(name: string, color?: string): Promise<CategoryResult> {
  const clean = name.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Give the category a name." };
  const existing = await listCategories();
  const same = existing.find((c) => c.name.trim().toLowerCase() === clean.toLowerCase());
  if (same) return { ok: true, category: same };
  const user = await currentUser();
  const now = new Date().toISOString();
  const category: Category = {
    id: crypto.randomUUID(), user_id: user?.id ?? "local", name: clean,
    color: color ?? nextColor(existing), created_at: now, last_used_at: now,
  };
  if (!user) {
    await write(LOCAL_C, [category, ...existing]);
  } else {
    const { user_id: _u, ...cat } = category;
    const { data, error } = await supabase.from("categories").insert(cat).select("*").single();
    if (error && !isNetworkError(error)) return { ok: false, error: error.message };
    if (error) await enqueue({ op: "catUpsert", category });
    await write(CACHE_C, [data ?? category, ...existing]);
    if (data) Object.assign(category, data);
  }
  await changed();
  return { ok: true, category };
}

async function updateCategory(id: string, patch: CategoryPatch): Promise<CategoryResult> {
  const clean: CategoryPatch = {};
  if (patch.name !== undefined) clean.name = patch.name.trim().slice(0, 60);
  if (patch.color !== undefined) clean.color = patch.color;
  if (clean.name === "") return { ok: false, error: "Give the category a name." };
  const user = await currentUser();
  const all = await listCategories();
  const current = all.find((c) => c.id === id);
  if (!current) return { ok: false, error: "Category not found." };
  const next = { ...current, ...clean };
  if (!user) {
    await write(LOCAL_C, all.map((c) => (c.id === id ? next : c)));
  } else {
    const { error } = await supabase.from("categories").update(clean).eq("id", id);
    if (error && !isNetworkError(error)) {
      return { ok: false, error: error.code === "23505" ? "You already have a category with that name." : error.message };
    }
    if (error) await enqueue({ op: "catUpsert", category: next });
    await write(CACHE_C, all.map((c) => (c.id === id ? next : c)));
  }
  await changed();
  return { ok: true, category: next };
}

async function deleteCategory(id: string): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user) {
    await write(LOCAL_C, (await localCategories()).filter((c) => c.id !== id));
    await write(LOCAL_H, (await localHighlights()).map((h) => ({ ...h, category_ids: (h.category_ids ?? []).filter((x) => x !== id) })));
  } else {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error && !isNetworkError(error)) return { ok: false };
    if (error) await enqueue({ op: "catDelete", id });
    await write(CACHE_C, (await read<Category[]>(CACHE_C, [])).filter((c) => c.id !== id));
  }
  await changed();
  return { ok: true };
}

/** Mark categories as just used, so they rise to the top of the picker. */
async function touchCategories(ids: string[] | undefined) {
  if (!ids?.length) return;
  const now = new Date().toISOString();
  if (!(await currentUser())) {
    await write(LOCAL_C, (await localCategories()).map((c) => (ids.includes(c.id) ? { ...c, last_used_at: now } : c)));
    return;
  }
  await supabase.from("categories").update({ last_used_at: now }).in("id", ids);
}

// ---- Highlights ----
async function list(canonicalUrl: string): Promise<ListResult> {
  const user = await currentUser();
  const categories = await listCategories();
  if (!user) {
    const highlights = (await localHighlights()).filter((h) => h.canonical_url === canonicalUrl);
    return { signedIn: false, highlights, categories };
  }
  const q = await getQueue();
  const pending = q.filter((o): o is Extract<QueueOp, { op: "create" }> => o.op === "create" && o.draft.canonical_url === canonicalUrl);
  const deleted = new Set(q.flatMap((o) => (o.op === "delete" ? [o.id] : [])));
  const { data, error } = await supabase.from("highlights").select("*").eq("canonical_url", canonicalUrl).order("created_at");
  let highlights: Highlight[];
  let offline = false;
  if (error) {
    highlights = await read<Highlight[]>(cacheKey(canonicalUrl), []);
    offline = true;
  } else {
    highlights = data as Highlight[];
    await write(cacheKey(canonicalUrl), highlights);
  }
  const ids = new Set(highlights.map((h) => h.id));
  for (const p of pending) if (!ids.has(p.draft.id)) highlights.push(draftToHighlight(p.draft, user.id, p.at));
  return { signedIn: true, offline, categories, highlights: highlights.filter((h) => !deleted.has(h.id)) };
}

/** Recent highlights across all pages, for the side panel's "All" view. */
async function listAll(): Promise<ListResult> {
  const user = await currentUser();
  const categories = await listCategories();
  if (!user) {
    const highlights = (await localHighlights()).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { signedIn: false, highlights, categories };
  }
  const { data, error } = await supabase.from("highlights").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) return { signedIn: true, offline: true, highlights: [], categories };
  return { signedIn: true, highlights: data as Highlight[], categories };
}

async function save(draft: Draft): Promise<SaveResult> {
  const user = await currentUser();
  const at = new Date().toISOString();
  const d: Draft = { ...draft, category_ids: draft.category_ids ?? [] };
  if (!user) {
    const all = await localHighlights();
    const dupe = all.find((h) => h.canonical_url === d.canonical_url && normalizeText(h.selected_text) === normalizeText(d.selected_text) && h.prefix === d.prefix && h.suffix === d.suffix);
    if (dupe) return { ok: true, highlight: dupe, existing: true, local: true };
    const h = draftToHighlight(d, "local", at);
    await write(LOCAL_H, [...all, h]);
    await touchCategories(d.category_ids);
    await changed();
    return { ok: true, highlight: h, local: true };
  }
  const { data, error } = await supabase.from("highlights").insert(row(d)).select("*").single();
  if (!error) {
    await patchCache(d.canonical_url, (hs) => [...hs, data as Highlight]);
    void touchCategories(d.category_ids);
    void flushQueue();
    await changed();
    return { ok: true, highlight: data as Highlight };
  }
  if (error.code === "23505") {
    // Duplicate: return the existing record so the user can edit it.
    const { data: existing } = await supabase
      .from("highlights").select("*")
      .eq("canonical_url", d.canonical_url)
      .eq("normalised_text", normalizeText(d.selected_text))
      .eq("prefix", d.prefix).eq("suffix", d.suffix)
      .maybeSingle();
    if (existing) return { ok: true, highlight: existing as Highlight, existing: true };
    return { ok: false, error: "This highlight already exists." };
  }
  if (isNetworkError(error)) {
    await enqueue({ op: "create", draft: d, at });
    return { ok: true, queued: true, highlight: draftToHighlight(d, user.id, at) };
  }
  return { ok: false, error: error.message };
}

/** Put back a highlight that was just deleted (Undo). */
async function restore(h: Highlight): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) {
    const all = await localHighlights();
    if (!all.some((x) => x.id === h.id)) await write(LOCAL_H, [...all, h]);
    await changed();
    return { ok: true, highlight: h, local: true };
  }
  const { user_id: _u, updated_at: _t, ...fields } = h;
  const { error } = await supabase.from("highlights").insert(row(fields));
  if (error && error.code !== "23505") {
    if (!isNetworkError(error)) return { ok: false, error: error.message };
    const { id, created_at, category_ids, note, ...rest } = fields;
    await enqueue({ op: "create", draft: { id, note, category_ids, ...rest } as Draft, at: created_at });
  }
  await changed();
  return { ok: true, highlight: h };
}

async function update(id: string, patch: HighlightPatch): Promise<SaveResult> {
  const user = await currentUser();
  if (!user) {
    const all = await localHighlights();
    const h = all.find((x) => x.id === id);
    if (!h) return { ok: false, error: "Highlight not found" };
    const next = { ...h, ...patch, updated_at: new Date().toISOString() };
    await write(LOCAL_H, all.map((x) => (x.id === id ? next : x)));
    await touchCategories(patch.category_ids);
    await changed();
    return { ok: true, highlight: next, local: true };
  }
  const { data, error } = await supabase.from("highlights").update(patch).eq("id", id).select("*").maybeSingle();
  if (!error && data) {
    await patchCache((data as Highlight).canonical_url, (hs) => hs.map((h) => (h.id === id ? (data as Highlight) : h)));
    void touchCategories(patch.category_ids);
    await changed();
    return { ok: true, highlight: data as Highlight };
  }
  // Offline, or not on the server yet: fold the change into a pending create, or queue it.
  const q = await getQueue();
  const pendingCreate = q.find((o) => o.op === "create" && o.draft.id === id) as Extract<QueueOp, { op: "create" }> | undefined;
  if (pendingCreate) {
    Object.assign(pendingCreate.draft, patch);
    await setQueue(q);
    await changed();
    return { ok: true, queued: true, highlight: draftToHighlight(pendingCreate.draft, user.id, pendingCreate.at) };
  }
  if (error && isNetworkError(error)) {
    await enqueue({ op: "update", id, patch });
    await changed();
    return { ok: true, queued: true, highlight: { id, ...patch } as Highlight };
  }
  return { ok: false, error: error?.message ?? "Highlight not found" };
}

async function remove(id: string): Promise<{ ok: boolean; queued?: boolean }> {
  const user = await currentUser();
  if (!user) {
    await write(LOCAL_H, (await localHighlights()).filter((h) => h.id !== id));
    await changed();
    return { ok: true };
  }
  const q = await getQueue();
  if (q.some((o) => o.op === "create" && o.draft.id === id)) {
    await setQueue(q.filter((o) => !(o.op === "create" && o.draft.id === id) && !(o.op === "update" && o.id === id)));
    await changed();
    return { ok: true };
  }
  const { data: row } = await supabase.from("highlights").select("canonical_url").eq("id", id).maybeSingle();
  const { error } = await supabase.from("highlights").delete().eq("id", id);
  if (!error) {
    if (row) await patchCache(row.canonical_url as string, (hs) => hs.filter((h) => h.id !== id));
    await changed();
    return { ok: true };
  }
  if (isNetworkError(error)) {
    await enqueue({ op: "delete", id });
    await changed();
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
    case "openPanel": {
      // Must run before any await: Chrome only allows this right after the user's click.
      const tabId = sender.tab?.id;
      if (tabId === undefined) return { ok: false };
      try { await chrome.sidePanel.open({ tabId }); return { ok: true }; } catch { await openLibrary(); return { ok: false }; }
    }
    case "session": return (await currentUser()) ?? (await signInFromWeb());
    case "signIn":
      try { return { ok: true, user: await signIn() }; } catch (e) { return { ok: false, error: (e as Error).message }; }
    case "signOut":
      await supabase.auth.signOut({ scope: "local" }); // only this extension, never the website
      await changed();
      return { ok: true };
    case "list": return list(msg.canonicalUrl);
    case "listAll": return listAll();
    case "save": return save(msg.draft);
    case "update": return update(msg.id, msg.patch);
    case "delete": return remove(msg.id);
    case "restore": return restore(msg.highlight);
    case "categories": return listCategories();
    case "createCategory": return createCategory(msg.name, msg.color);
    case "updateCategory": return updateCategory(msg.id, msg.patch);
    case "deleteCategory": return deleteCategory(msg.id);
    case "openLibrary": return openLibrary();
    case "queueSize": return (await getQueue()).length;
    case "localCount": return (await localHighlights()).length;
    case "adoptSession": return adoptSession(msg.tokenHash);
    case "badge":
      if (sender.tab?.id !== undefined) await setTabBadge(sender.tab.id, msg.painted, msg.unresolved);
      return null;
  }
}

chrome.runtime.onMessage.addListener((msg: Request | PanelMessage, sender, reply) => {
  if (msg.type === "changed") return false; // our own broadcast to the panel
  handle(msg, sender).then(reply, (e) => reply({ ok: false, error: String(e?.message ?? e) }));
  return true; // async response
});

// Clicking the toolbar icon (or Alt+G) opens the side panel.
void chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// Creating the alarm while Chrome is still registering the service worker can throw "No SW",
// so only create it when it's missing, and ignore that transient failure.
async function ensureSyncAlarm() {
  try {
    if (!(await chrome.alarms.get("sync"))) await chrome.alarms.create("sync", { periodInMinutes: 1 });
  } catch { /* retried on the next startup or install */ }
}
void ensureSyncAlarm();
chrome.alarms.onAlarm.addListener((a) => { if (a.name === "sync") void flushQueue(); });
chrome.runtime.onStartup.addListener(() => { void ensureSyncAlarm(); void flushQueue(); });
chrome.runtime.onInstalled.addListener(({ reason }) => {
  // First install: Gather's own welcome page, which offers to open the side panel.
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) void chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  // Chrome doesn't add content scripts to tabs that were already open, so add them now.
  void chrome.tabs.query({ url: ["http://*/*", "https://*/*"] }).then((tabs) => {
    for (const t of tabs) {
      if (t.id !== undefined) chrome.scripting.executeScript({ target: { tabId: t.id }, files: ["content.js"] }).catch(() => {});
    }
  });
  void flushQueue();
});

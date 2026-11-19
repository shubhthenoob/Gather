import {
  byRecent, canonicalizeUrl, categoriesOf, highlightColor, isHexColor, isSupportedUrl, PALETTE, UNCATEGORISED_COLOR,
  type Category, type Highlight,
} from "@highlight/shared";
import {
  send, JUMP_KEY, PANEL_CLOSED_KEY, type CategoryResult, type HighlightPatch, type Jump, type ListResult, type PanelMessage, type SaveResult,
  type TabStatus, type UserInfo,
} from "./messages";

declare const __WEB_URL__: string;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const UNCAT = "__none__";

// ---------- State ----------
let user: UserInfo | null = null;
let scope: "page" | "all" = "page";
let userPickedAll = false;
let autoAll = false; // switched to All because this page has nothing yet
let view: "list" | "categories" = "list";
let query = "";
const filter = new Set<string>();
let highlights: Highlight[] = [];
let categories: Category[] = [];
let allForCounts: Highlight[] = [];
let tab: { id: number; url: string; canonical: string } | null = null;
let unresolvedIds = new Set<string>();
const expanded = new Set<string>();
let editingId: string | null = null;
let renamingId: string | null = null;
let creatingCategory = false;
let pageMessage = "";

// ---------- Helpers ----------
type Props = { cls?: string; style?: string; [key: string]: unknown };
function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: (Node | string | null | false)[]): HTMLElementTagNameMap[K] {
  const { cls, style, ...rest } = props;
  const e = document.createElement(tag);
  Object.assign(e, rest);
  if (cls) e.className = cls;
  if (style) e.setAttribute("style", style);
  for (const c of children) if (c) e.append(c);
  return e;
}

function dot(color: string, hollow = false) {
  const d = h("span", { cls: hollow ? "dot hollow" : "dot" });
  d.style.background = color;
  return d;
}

const ICONS = {
  tag: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
  edit: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>',
  check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
};

function iconButton(icon: keyof typeof ICONS, label: string, onClick: (b: HTMLButtonElement) => void, text?: string) {
  const b = h("button", { cls: "icon-btn", type: "button", title: label });
  b.setAttribute("aria-label", label);
  b.innerHTML = ICONS[icon] + (text ? `<span>${text}</span>` : "");
  b.addEventListener("click", (e) => { e.stopPropagation(); onClick(b); });
  return b;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(message: string, action?: { label: string; run: () => void }) {
  document.querySelector(".toast")?.remove();
  clearTimeout(toastTimer);
  const t = h("div", { cls: "toast" }, h("span", { textContent: message }));
  t.setAttribute("role", "status");
  if (action) t.append(h("button", { textContent: action.label, onclick: () => { t.remove(); action.run(); } }));
  document.body.append(t);
  toastTimer = setTimeout(() => t.remove(), action ? 6000 : 2200);
}

function closePop() {
  document.querySelector(".pop")?.remove();
}

function placePop(pop: HTMLElement, anchor: HTMLElement) {
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, ph = pop.offsetHeight;
  let top = r.bottom + 6;
  if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
  const left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;
}

// ---------- Data ----------
async function currentTab() {
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  tab = t?.id !== undefined && t.url && isSupportedUrl(t.url) ? { id: t.id, url: t.url, canonical: canonicalizeUrl(t.url) } : null;
}

async function load() {
  await currentTab();
  user = await send<UserInfo | null>({ type: "session" });
  pageMessage = "";
  autoAll = false;
  let res: ListResult;
  if (view === "categories") {
    res = await send<ListResult>({ type: "listAll" });
    allForCounts = res.highlights;
  } else if (scope === "page" && tab) {
    res = await send<ListResult>({ type: "list", canonicalUrl: tab.canonical });
    if (!res.highlights.length && !userPickedAll) {
      autoAll = true;
      pageMessage = "Nothing on this page yet. Showing everything you've saved.";
      res = await send<ListResult>({ type: "listAll" });
    }
  } else {
    if (scope === "page" && !tab) pageMessage = "Gather can't run on this page. Showing everything you've saved.";
    res = await send<ListResult>({ type: "listAll" });
  }
  highlights = res.highlights ?? [];
  categories = (res.categories ?? []).sort(byRecent);
  for (const id of [...filter]) if (id !== UNCAT && !categories.some((c) => c.id === id)) filter.delete(id);
  unresolvedIds = new Set();
  if (tab && scope === "page" && !autoAll) {
    try {
      const status = (await chrome.tabs.sendMessage(tab.id, { type: "status" })) as TabStatus;
      unresolvedIds = new Set(status.unresolvedIds ?? []);
    } catch { /* page not ready */ }
  }
  render();
}

let reloadTimer: ReturnType<typeof setTimeout> | undefined;
function reloadSoon() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    // Don't wipe a note being typed.
    if (editingId || renamingId || document.querySelector(".pop")) return;
    void load();
  }, 250);
}

// ---------- Actions ----------
async function patch(hl: Highlight, p: HighlightPatch) {
  const res = await send<SaveResult>({ type: "update", id: hl.id, patch: p });
  if (!res.ok) { toast(res.error || "Could not update."); return; }
  Object.assign(hl, p);
  render();
}

async function remove(hl: Highlight) {
  const res = await send<{ ok: boolean }>({ type: "delete", id: hl.id });
  if (!res.ok) { toast("Could not delete."); return; }
  highlights = highlights.filter((x) => x.id !== hl.id);
  render();
  toast("Highlight deleted", {
    label: "Undo",
    run: async () => { await send<SaveResult>({ type: "restore", highlight: hl }); await load(); },
  });
}

async function copy(hl: Highlight, b: HTMLButtonElement) {
  const parts = [`“${hl.selected_text.trim()}”`];
  if (hl.note?.trim()) parts.push(`Note: ${hl.note.trim()}`);
  parts.push(`— ${hl.page_title || hl.domain}\n${hl.source_url}`);
  await navigator.clipboard.writeText(parts.join("\n\n"));
  b.classList.add("done");
  b.innerHTML = ICONS.check + "<span>Copied</span>";
  setTimeout(() => { b.classList.remove("done"); b.innerHTML = ICONS.copy + "<span>Copy</span>"; }, 1500);
}

/** On this page: scroll to it. Elsewhere: switch to (or open) its page, then jump to it. */
async function openHighlight(hl: Highlight) {
  if (tab && tab.canonical === hl.canonical_url) {
    const ok = await chrome.tabs.sendMessage(tab.id, { type: "scrollTo", id: hl.id }).catch(() => false);
    if (!ok && unresolvedIds.has(hl.id)) toast("This passage may have changed on the page.");
    return;
  }
  const tabs = await chrome.tabs.query({});
  const open = tabs.find((t) => t.url && isSupportedUrl(t.url) && canonicalizeUrl(t.url) === hl.canonical_url);
  if (open?.id !== undefined) {
    await chrome.tabs.update(open.id, { active: true });
    if (open.windowId !== undefined) await chrome.windows.update(open.windowId, { focused: true });
    await chrome.tabs.sendMessage(open.id, { type: "scrollTo", id: hl.id }).catch(() => {});
    return;
  }
  await chrome.storage.local.set({ [JUMP_KEY]: { canonical: hl.canonical_url, id: hl.id, at: Date.now() } satisfies Jump });
  await chrome.tabs.create({ url: hl.source_url });
}

async function createCategory(name: string, color?: string): Promise<Category | null> {
  const res = await send<CategoryResult>({ type: "createCategory", name, color });
  if (!res.ok) { toast(res.error); return null; }
  if (!categories.some((c) => c.id === res.category.id)) categories = [res.category, ...categories];
  return res.category;
}

// ---------- Popovers ----------
/** Toggle a highlight's categories; also creates new ones. Changes apply immediately. */
function openPicker(hl: Highlight, anchor: HTMLElement) {
  closePop();
  const chosen = new Set(hl.category_ids ?? []);
  const input = h("input", { type: "text", placeholder: categories.length ? "Search or create a category" : "Name your first category" });
  input.setAttribute("aria-label", "Search or create a category");
  const list = h("div", { cls: "pop-list" });
  list.setAttribute("role", "listbox");
  const pop = h("div", { cls: "pop" }, input, list, h("div", { cls: "row-end" }, h("button", { cls: "btn", textContent: "Done", onclick: () => { closePop(); render(); } })));
  pop.setAttribute("role", "dialog");
  let active = 0;
  let runs: (() => void)[] = [];

  const commit = () => void patch(hl, { category_ids: [...chosen] });

  function draw() {
    const q = input.value.trim().toLowerCase();
    list.replaceChildren();
    runs = [];
    for (const c of categories.filter((x) => x.name.toLowerCase().includes(q))) {
      const on = chosen.has(c.id);
      const row = h("button", { cls: "pop-row", type: "button" }, dot(c.color), h("span", { cls: "name", textContent: c.name }), h("span", { cls: "tick", textContent: on ? "✓" : "" }));
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", String(on));
      const run = () => { if (chosen.has(c.id)) chosen.delete(c.id); else chosen.add(c.id); commit(); draw(); };
      row.addEventListener("click", run);
      list.append(row);
      runs.push(run);
    }
    if (q && !categories.some((c) => c.name.toLowerCase() === q)) {
      const row = h("button", { cls: "pop-row create", type: "button" }, h("span", { cls: "tick", textContent: "+" }), h("span", { cls: "name", textContent: `Create “${input.value.trim()}”` }));
      const run = async () => {
        const c = await createCategory(input.value.trim());
        if (!c) return;
        chosen.add(c.id);
        input.value = "";
        commit();
        draw();
      };
      row.addEventListener("click", () => void run());
      list.append(row);
      runs.push(() => void run());
    }
    if (!runs.length) list.append(h("p", { cls: "muted", textContent: "Type a name to create a category." }));
    active = Math.min(active, Math.max(0, runs.length - 1));
    [...list.querySelectorAll(".pop-row")].forEach((r, i) => r.classList.toggle("active", i === active));
  }
  input.addEventListener("input", () => { active = 0; draw(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { active = Math.min(active + 1, runs.length - 1); draw(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { active = Math.max(active - 1, 0); draw(); e.preventDefault(); }
    else if (e.key === "Enter") { e.preventDefault(); runs[active]?.(); }
    else if (e.key === "Escape") { closePop(); render(); }
  });
  draw();
  placePop(pop, anchor);
  input.focus();
}

/** Preset colours plus a custom colour picker. */
function openPalette(anchor: HTMLElement, current: string, onPick: (color: string) => void) {
  closePop();
  const grid = h("div", { cls: "palette" });
  for (const c of PALETTE) {
    const s = h("button", { cls: "swatch", type: "button", title: c });
    s.style.background = c;
    s.setAttribute("aria-label", `Colour ${c}`);
    s.setAttribute("aria-pressed", String(c.toLowerCase() === current.toLowerCase()));
    s.addEventListener("click", () => { closePop(); onPick(c); });
    grid.append(s);
  }
  const colorInput = h("input", { type: "color", value: isHexColor(current) ? current : PALETTE[0], title: "Custom colour" });
  colorInput.setAttribute("aria-label", "Custom colour");
  const hex = h("input", { type: "text", value: current, maxLength: 7 });
  hex.setAttribute("aria-label", "Hex colour");
  colorInput.addEventListener("input", () => { hex.value = colorInput.value; });
  const apply = () => { const v = hex.value.trim(); if (isHexColor(v)) { closePop(); onPick(v.toLowerCase()); } else toast("Use a hex colour like #7c4dff"); };
  colorInput.addEventListener("change", () => { hex.value = colorInput.value; apply(); });
  hex.addEventListener("keydown", (e) => { if (e.key === "Enter") apply(); if (e.key === "Escape") closePop(); });
  const pop = h("div", { cls: "pop" }, grid, h("div", { cls: "custom" }, colorInput, hex, h("button", { cls: "btn", textContent: "Set", onclick: apply })));
  placePop(pop, anchor);
}

// ---------- Rendering ----------
function matches(hl: Highlight): boolean {
  if (filter.size) {
    const ids = hl.category_ids ?? [];
    const ok = [...filter].some((f) => (f === UNCAT ? ids.length === 0 || !categoriesOf(hl, categories).length : ids.includes(f)));
    if (!ok) return false;
  }
  if (!query) return true;
  const q = query.toLowerCase();
  const names = categoriesOf(hl, categories).map((c) => c.name).join(" ");
  return [hl.selected_text, hl.note ?? "", hl.page_title, hl.domain, names].some((s) => s.toLowerCase().includes(q));
}

function renderAccount() {
  const box = $("account");
  box.replaceChildren();
  if (user) {
    const img = user.avatar ? h("img", { cls: "avatar", src: user.avatar, alt: "", referrerPolicy: "no-referrer" }) : h("span", { cls: "avatar" });
    const b = h("button", { cls: "icon-btn", type: "button", title: `${user.name ?? "Signed in"}${user.email ? ` (${user.email})` : ""}` }, img);
    b.setAttribute("aria-label", "Account");
    b.addEventListener("click", () => {
      closePop();
      const pop = h("div", { cls: "pop" },
        h("p", { cls: "muted", textContent: user?.email ?? "Signed in", style: "margin:4px 8px 8px" }),
        h("button", { cls: "pop-row", type: "button", textContent: "Open library ↗", onclick: () => { closePop(); void send({ type: "openLibrary" }); } }),
        h("button", { cls: "pop-row", type: "button", textContent: "Sign out", style: "color:var(--danger)", onclick: async () => { closePop(); await send({ type: "signOut" }); await load(); } }),
      );
      placePop(pop, b);
    });
    box.append(b);
  } else {
    const b = h("button", { cls: "btn primary", type: "button", textContent: "Sign in" });
    b.addEventListener("click", async () => {
      b.textContent = "Opening Google…";
      const res = await send<{ ok: boolean; error?: string }>({ type: "signIn" });
      if (!res.ok) toast(res.error ?? "Sign-in failed.");
      await load();
    });
    box.append(b);
  }
  let dismissed = false;
  try { dismissed = sessionStorage.getItem("bannerDismissed") === "1"; } catch { /* ignore */ }
  $("banner").hidden = !!user || dismissed;
}

function renderChips() {
  const box = $("chips");
  box.replaceChildren();
  if (view !== "list") { $("list-controls").hidden = true; return; }
  $("list-controls").hidden = false;
  $("scope-page").setAttribute("aria-pressed", String(scope === "page" && !autoAll));
  $("scope-all").setAttribute("aria-pressed", String(scope === "all" || autoAll));
  const counts = new Map<string, number>();
  let uncat = 0;
  for (const hl of highlights) {
    const cats = categoriesOf(hl, categories);
    if (!cats.length) uncat++;
    for (const c of cats) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  }
  const chip = (label: string, color: string | null, pressed: boolean, count: number | null, onClick: () => void, hollow = false) => {
    const b = h("button", { cls: "chip", type: "button" });
    b.setAttribute("aria-pressed", String(pressed));
    if (color) b.append(dot(color, hollow));
    b.append(label);
    if (count !== null) b.append(h("span", { cls: "count", textContent: String(count) }));
    b.addEventListener("click", onClick);
    return b;
  };
  box.append(chip("All", null, filter.size === 0, null, () => { filter.clear(); render(); }));
  for (const c of categories) {
    box.append(chip(c.name, c.color, filter.has(c.id), counts.get(c.id) ?? 0, () => { if (filter.has(c.id)) filter.delete(c.id); else filter.add(c.id); render(); }));
  }
  if (highlights.length) box.append(chip("Uncategorised", UNCATEGORISED_COLOR, filter.has(UNCAT), uncat, () => { if (filter.has(UNCAT)) filter.delete(UNCAT); else filter.add(UNCAT); render(); }, true));
}

function card(hl: Highlight, showSource: boolean): HTMLElement {
  const el = h("article", { cls: `card clickable${expanded.has(hl.id) ? " expanded" : ""}`, tabIndex: 0 });
  el.style.setProperty("--bar", highlightColor(hl, categories));
  el.setAttribute("aria-label", hl.selected_text.slice(0, 120));
  el.append(h("p", { cls: "quote", textContent: hl.selected_text }));
  if (unresolvedIds.has(hl.id)) el.append(h("div", { cls: "unresolved", textContent: "This passage may have changed on the page." }));

  if (editingId === hl.id) {
    const ta = h("textarea", { value: hl.note ?? "", placeholder: "Add a note…", rows: 3 });
    const saveNote = async () => { editingId = null; await patch(hl, { note: ta.value.trim() || null }); };
    const cancel = () => { editingId = null; render(); };
    ta.addEventListener("click", (e) => e.stopPropagation());
    ta.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void saveNote();
      if (e.key === "Escape") cancel();
    });
    el.append(ta, h("div", { cls: "row-end" },
      h("button", { cls: "btn", textContent: "Cancel", onclick: (e: Event) => { e.stopPropagation(); cancel(); } }),
      h("button", { cls: "btn primary", textContent: "Save", onclick: (e: Event) => { e.stopPropagation(); void saveNote(); } }),
    ));
    setTimeout(() => ta.focus(), 0);
  } else if (hl.note) {
    el.append(h("div", { cls: "note", textContent: hl.note }));
  }

  const cats = categoriesOf(hl, categories);
  if (cats.length) {
    const row = h("div", { cls: "card-cats" });
    for (const c of cats) {
      const b = h("button", { cls: "chip", type: "button", title: `Show only ${c.name}` }, dot(c.color), c.name);
      b.addEventListener("click", (e) => { e.stopPropagation(); filter.clear(); filter.add(c.id); render(); });
      row.append(b);
    }
    el.append(row);
  }

  if (showSource) {
    const a = h("a", { cls: "source", href: hl.source_url, textContent: `${hl.page_title || hl.domain} ↗`, title: hl.page_title || hl.source_url });
    a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); void openHighlight(hl); });
    el.append(a);
  }

  el.append(h("div", { cls: "card-actions" },
    iconButton("tag", cats.length ? "Change categories" : "Add category", (b) => openPicker(hl, b), cats.length ? "Category" : "Add category"),
    iconButton("edit", hl.note ? "Edit note" : "Add note", () => { editingId = hl.id; render(); }, hl.note ? "Edit" : "Note"),
    iconButton("copy", "Copy quote, note and link", (b) => void copy(hl, b), "Copy"),
    iconButton("trash", "Delete highlight", () => void remove(hl), "Delete"),
  ));

  const activate = () => {
    if (editingId === hl.id) return;
    if (expanded.has(hl.id)) expanded.delete(hl.id); else expanded.add(hl.id);
    el.classList.toggle("expanded");
    void openHighlight(hl);
  };
  el.addEventListener("click", activate);
  el.addEventListener("keydown", (e) => {
    if (e.target !== el) return;
    if (e.key === "Enter") activate();
    if (e.key === "ArrowDown") { (el.nextElementSibling as HTMLElement | null)?.focus(); e.preventDefault(); }
    if (e.key === "ArrowUp") { (el.previousElementSibling as HTMLElement | null)?.focus(); e.preventDefault(); }
  });
  return el;
}

function renderList(main: HTMLElement) {
  const shown = highlights.filter(matches);
  if (pageMessage) main.append(h("p", { cls: "summary", textContent: pageMessage }));
  if (!highlights.length) {
    main.append(h("div", { cls: "empty" },
      h("strong", { textContent: "Nothing saved yet" }),
      "Select text on any page and click Save to keep it here.",
    ));
    return;
  }
  if (!shown.length) {
    const more = scope === "page" && !autoAll ? h("button", { cls: "btn", textContent: "Search all pages", onclick: () => { scope = "all"; userPickedAll = true; void load(); } }) : null;
    main.append(h("div", { cls: "empty" }, h("strong", { textContent: "No matches" }), "Try another word or category.", more ? h("div", { style: "margin-top:10px" }, more) : null));
    return;
  }
  main.append(h("p", { cls: "summary", textContent: `${shown.length} highlight${shown.length === 1 ? "" : "s"}` }));
  if (scope === "page" && !autoAll) {
    for (const hl of shown) main.append(card(hl, false));
    return;
  }
  // All pages: group by page, newest first.
  const groups = new Map<string, Highlight[]>();
  for (const hl of shown) {
    const g = groups.get(hl.canonical_url);
    if (g) g.push(hl); else groups.set(hl.canonical_url, [hl]);
  }
  for (const [, items] of groups) {
    const first = items[0];
    const link = h("a", { href: first.source_url, textContent: `${first.page_title || first.domain} ↗`, title: first.page_title || first.source_url });
    link.addEventListener("click", (e) => { e.preventDefault(); void openHighlight(first); });
    main.append(h("div", { cls: "group" },
      h("img", { src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(first.domain)}&sz=32`, alt: "" }),
      link,
      h("span", { cls: "muted", textContent: String(items.length) }),
    ));
    for (const hl of items) main.append(card(hl, false));
  }
}

function renderCategories(main: HTMLElement) {
  main.append(h("p", { cls: "summary", textContent: "Click a colour to change it, a name to rename it." }));
  const counts = new Map<string, { n: number; latest?: Highlight }>();
  let uncat = 0;
  for (const hl of allForCounts) {
    const cats = categoriesOf(hl, categories);
    if (!cats.length) uncat++;
    for (const c of cats) {
      const e = counts.get(c.id) ?? { n: 0 };
      e.n++;
      if (!e.latest || hl.created_at > e.latest.created_at) e.latest = hl;
      counts.set(c.id, e);
    }
  }
  for (const c of categories) {
    const info = counts.get(c.id);
    const swatch = h("button", { cls: "dot", type: "button", title: "Change colour" });
    swatch.style.background = c.color;
    swatch.setAttribute("aria-label", `Change colour of ${c.name}`);
    swatch.addEventListener("click", () => openPalette(swatch, c.color, async (color) => {
      const r = await send<CategoryResult>({ type: "updateCategory", id: c.id, patch: { color } });
      if (!r.ok) toast(r.error); else { c.color = color; render(); }
    }));
    const body = h("div", { cls: "info" });
    if (renamingId === c.id) {
      const input = h("input", { value: c.name, maxLength: 60 });
      input.setAttribute("aria-label", "Category name");
      const done = async (save: boolean) => {
        renamingId = null;
        if (save && input.value.trim() && input.value.trim() !== c.name) {
          const r = await send<CategoryResult>({ type: "updateCategory", id: c.id, patch: { name: input.value } });
          if (!r.ok) toast(r.error); else c.name = r.category.name;
        }
        render();
      };
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") void done(true); if (e.key === "Escape") void done(false); });
      input.addEventListener("blur", () => void done(true));
      body.append(input);
      setTimeout(() => input.select(), 0);
    } else {
      body.append(h("button", { cls: "name", type: "button", textContent: c.name, title: "Rename", onclick: () => { renamingId = c.id; render(); } }));
    }
    body.append(h("div", { cls: "preview", textContent: info ? `${info.n} · “${info.latest?.selected_text.slice(0, 60) ?? ""}”` : "No highlights yet" }));
    const showBtn = h("button", { cls: "btn", type: "button", textContent: "Show", onclick: () => { filter.clear(); filter.add(c.id); view = "list"; scope = "all"; userPickedAll = true; void load(); } });
    const del = iconButton("trash", `Delete ${c.name}`, async () => {
      if (!confirm(`Delete “${c.name}”? Its highlights are kept and become uncategorised.`)) return;
      await send({ type: "deleteCategory", id: c.id });
      await load();
    });
    main.append(h("div", { cls: "cat-card" }, swatch, body, showBtn, del));
  }
  main.append(h("div", { cls: "cat-card" },
    dot(UNCATEGORISED_COLOR, true),
    h("div", { cls: "info" }, h("div", { cls: "name", textContent: "Uncategorised", style: "cursor:default" }), h("div", { cls: "preview", textContent: `${uncat} highlight${uncat === 1 ? "" : "s"}` })),
    h("button", { cls: "btn", type: "button", textContent: "Show", onclick: () => { filter.clear(); filter.add(UNCAT); view = "list"; scope = "all"; userPickedAll = true; void load(); } }),
  ));

  if (creatingCategory) {
    const input = h("input", { placeholder: "Category name", maxLength: 60 });
    input.setAttribute("aria-label", "New category name");
    const done = async (save: boolean) => {
      creatingCategory = false;
      if (save && input.value.trim()) await createCategory(input.value.trim());
      render();
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") void done(true); if (e.key === "Escape") void done(false); });
    input.addEventListener("blur", () => void done(true));
    main.append(h("div", { cls: "cat-card" }, dot(PALETTE[categories.length % PALETTE.length]), h("div", { cls: "info" }, input)));
    setTimeout(() => input.focus(), 0);
  } else {
    main.append(h("button", { cls: "btn", type: "button", textContent: "+ New category", style: "width:100%", onclick: () => { creatingCategory = true; render(); } }));
  }
}

function render() {
  renderAccount();
  renderChips();
  const main = $("main");
  const scrollTop = main.scrollTop;
  main.replaceChildren();
  if (view === "list") renderList(main); else renderCategories(main);
  main.scrollTop = scrollTop;
  $("toggle-view").textContent = view === "list" ? "Categories" : "‹ Highlights";
}

// ---------- Wiring ----------
const q = $<HTMLInputElement>("q");
q.addEventListener("input", () => { query = q.value.trim(); $("q-clear").hidden = !q.value; render(); });
q.addEventListener("keydown", (e) => { if (e.key === "Escape") { q.value = ""; query = ""; $("q-clear").hidden = true; render(); } });
$("q-clear").addEventListener("click", () => { q.value = ""; query = ""; $("q-clear").hidden = true; render(); q.focus(); });
$("scope-page").addEventListener("click", () => { scope = "page"; userPickedAll = false; void load(); });
$("scope-all").addEventListener("click", () => { scope = "all"; userPickedAll = true; void load(); });
$("toggle-view").addEventListener("click", () => { view = view === "list" ? "categories" : "list"; closePop(); void load(); });
$("open-library").addEventListener("click", () => void send({ type: "openLibrary" }));
$("banner-close").addEventListener("click", () => { try { sessionStorage.setItem("bannerDismissed", "1"); } catch { /* ignore */ } $("banner").hidden = true; });

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") { e.preventDefault(); q.focus(); }
});
document.addEventListener("mousedown", (e) => {
  const pop = document.querySelector(".pop");
  if (pop && !pop.contains(e.target as Node)) { closePop(); render(); }
});

// Follow the active tab, and refresh when anything changes elsewhere.
chrome.tabs.onActivated.addListener(() => { if (!userPickedAll) scope = "page"; reloadSoon(); });
chrome.tabs.onUpdated.addListener((_id, info, t) => { if (t.active && (info.url || info.status === "complete")) reloadSoon(); });
chrome.runtime.onMessage.addListener((msg: PanelMessage) => { if (msg?.type === "changed") reloadSoon(); return false; });

// Opening the panel (by any route) re-enables opening it after saves; closing it turns that off.
void chrome.storage.local.set({ [PANEL_CLOSED_KEY]: false });
window.addEventListener("pagehide", () => { void chrome.storage.local.set({ [PANEL_CLOSED_KEY]: true }); });

void load();
void __WEB_URL__;

import {
  byRecent, canonicalizeUrl, categoriesOf, domainOf, findQuote, highlightColor, highlightFill, isSupportedUrl, normalizeText,
  CONTEXT_LENGTH, type Category, type Highlight,
} from "@highlight/shared";
import { buildIndex, offsetsToRange, rangeToOffsets, trimOffsets, xpathOf, UI_HOST_ID, type TextIndex } from "./anchor";
import {
  send, extensionAlive, JUMP_KEY, type CategoryResult, type Draft, type HighlightPatch, type Jump, type ListResult,
  type SaveResult, type TabMessage, type TabStatus,
} from "./messages";
import { UI_CSS, PAGE_CSS } from "./styles";

declare const __WEB_URL__: string;

if (isSupportedUrl(location.href) && !document.getElementById(UI_HOST_ID)) main();

function main() {
  // ---------- State ----------
  let canonical = canonicalizeUrl(location.href);
  let highlights: Highlight[] = [];
  let categories: Category[] = [];
  const painted = new Map<string, Range>();
  const unresolved = new Set<string>();

  // ---------- Page-level highlight painting (CSS Custom Highlight API, no DOM changes) ----------
  // One registered highlight per colour (two shades each, alternating so neighbours stay distinct).
  type PaintLayer = InstanceType<typeof window.Highlight>;
  const layers = new Map<string, PaintLayer>();
  const hlActive = new window.Highlight();
  hlActive.priority = 1;
  CSS.highlights.set("hl-ext-active", hlActive);
  const pageStyle = document.createElement("style");
  pageStyle.textContent = PAGE_CSS;
  (document.head ?? document.documentElement).appendChild(pageStyle);

  function layer(color: string, shade: number): PaintLayer {
    const key = `gather-${color.slice(1).toLowerCase()}-${shade}`;
    let hl = layers.get(key);
    if (!hl) {
      hl = new window.Highlight();
      layers.set(key, hl);
      CSS.highlights.set(key, hl);
      pageStyle.textContent += `\n::highlight(${key}) { background-color: ${highlightFill(color, shade === 1)}; color: inherit; }`;
    }
    return hl;
  }

  // ---------- Shadow-DOM UI host, isolated from page styles ----------
  const host = document.createElement("div");
  host.id = UI_HOST_ID;
  host.style.cssText = "all: initial; position: absolute; top: 0; left: 0; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = UI_CSS;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);

  // ---------- Floating side tab: opens the Gather side panel; badge shows page status ----------
  const fab = document.createElement("button");
  fab.type = "button";
  fab.className = "fab";
  fab.innerHTML = `<svg viewBox="5 3 24 24" width="26" height="26" aria-hidden="true"><path d="M9 22l3-9 7 7-9 3z" fill="#202124"/><path d="M13 12l6-6 7 7-6 6z" fill="#fff" stroke="#202124" stroke-width="1.2" stroke-linejoin="round"/></svg><span class="fab-badge" hidden></span>`;
  fab.addEventListener("click", () => void send({ type: "openPanel" }));
  shadow.appendChild(fab);
  const fabBadge = fab.querySelector(".fab-badge") as HTMLElement;
  function updateFab() {
    let text = "", alert = false, title = "Open the Gather panel";
    if (unresolved.size) { text = "!"; alert = true; title = `Gather: ${unresolved.size} saved highlight(s) could not be found on this page`; }
    else if (highlights.length) { text = String(highlights.length); title = `Gather: ${highlights.length} on this page. Click to open the panel.`; }
    fabBadge.hidden = !text;
    fabBadge.textContent = text;
    fabBadge.classList.toggle("alert", alert);
    fab.title = title;
    fab.setAttribute("aria-label", title);
    // Stay tucked against the edge unless this page has something to show.
    fab.classList.toggle("peek", !text);
  }

  let panel: HTMLElement | null = null;
  let picker: HTMLElement | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function closePicker() {
    picker?.remove();
    picker = null;
  }
  function closePanel() {
    closePicker();
    panel?.remove();
    panel = null;
    hlActive.clear();
  }

  function place(el: HTMLElement, rect: DOMRect) {
    shadow.appendChild(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    const sx = window.scrollX, sy = window.scrollY;
    let top = rect.top + sy - h - 8;
    if (rect.top - h - 8 < 4) top = rect.bottom + sy + 8;
    let left = rect.left + sx + rect.width / 2 - w / 2;
    left = Math.max(sx + 8, Math.min(left, sx + document.documentElement.clientWidth - w - 8));
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
  }

  function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function button(label: string, onClick: () => void, cls = "btn") {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("mousedown", (e) => e.preventDefault()); // keep the page selection
    b.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
    return b;
  }

  function dot(color: string) {
    const d = el("span", "dot");
    d.style.background = color;
    return d;
  }

  function toast(message: string, action?: { label: string; run: () => void }, ms = action ? 6000 : 2500) {
    shadow.querySelector(".toast")?.remove();
    clearTimeout(toastTimer);
    const t = el("div", "toast");
    t.setAttribute("role", "status");
    t.append(el("span", "", message));
    if (action) t.append(button(action.label, () => { t.remove(); action.run(); }, "toast-action"));
    shadow.appendChild(t);
    toastTimer = setTimeout(() => t.remove(), ms);
  }

  // ---------- Capture ----------
  function captureDraft(range: Range, note: string | null): Draft | null {
    const index = buildIndex();
    const raw = rangeToOffsets(index, range);
    if (!raw) return null;
    const { start, end } = trimOffsets(index.text, raw.start, raw.end);
    const exact = index.text.slice(start, end);
    if (!exact.trim()) return null;
    return {
      id: crypto.randomUUID(),
      selected_text: exact,
      note: note?.trim() || null,
      source_url: location.href,
      canonical_url: canonical,
      page_title: document.title.slice(0, 500),
      domain: domainOf(location.href),
      prefix: index.text.slice(Math.max(0, start - CONTEXT_LENGTH), start),
      suffix: index.text.slice(end, end + CONTEXT_LENGTH),
      anchor_data: { xpath: xpathOf(range.startContainer), textOffset: start },
      category_ids: [],
    };
  }

  /** An existing highlight that overlaps the selection or has the same text and context. */
  function findExisting(range: Range, draft: Draft | null): Highlight | null {
    for (const [id, r] of painted) {
      try {
        const overlaps = range.compareBoundaryPoints(Range.END_TO_START, r) < 0 && range.compareBoundaryPoints(Range.START_TO_END, r) > 0;
        if (overlaps) return highlights.find((h) => h.id === id) ?? null;
      } catch { /* detached */ }
    }
    if (!draft) return null;
    const n = normalizeText(draft.selected_text);
    return highlights.find((h) => normalizeText(h.selected_text) === n && h.prefix === draft.prefix && h.suffix === draft.suffix) ?? null;
  }

  // ---------- Painting / restore ----------
  function repaint() {
    for (const hl of layers.values()) hl.clear();
    painted.clear(); unresolved.clear();
    let index: TextIndex | null = null;
    const ordered: { h: Highlight; range: Range }[] = [];
    for (const h of highlights) {
      index ??= buildIndex();
      const m = findQuote(index.text, { exact: h.selected_text, prefix: h.prefix, suffix: h.suffix, hint: h.anchor_data?.textOffset });
      const range = m ? offsetsToRange(index, m.start, m.end) : null;
      if (range) ordered.push({ h, range });
      else unresolved.add(h.id);
    }
    ordered.sort((a, b) => a.range.compareBoundaryPoints(Range.START_TO_START, b.range));
    ordered.forEach(({ h, range }, i) => {
      painted.set(h.id, range);
      layer(highlightColor(h, categories), i % 2).add(range);
    });
    void send({ type: "badge", painted: painted.size, unresolved: unresolved.size }).catch(() => {});
    updateFab();
  }

  async function load() {
    try {
      const res = await send<ListResult>({ type: "list", canonicalUrl: canonical });
      highlights = res.highlights ?? [];
      categories = (res.categories ?? []).sort(byRecent);
    } catch {
      highlights = [];
    }
    repaint();
  }

  function upsertLocal(h: Highlight) {
    const i = highlights.findIndex((x) => x.id === h.id);
    if (i >= 0) highlights[i] = { ...highlights[i], ...h };
    else highlights.push(h);
    repaint();
  }

  // ---------- Save / edit / delete ----------
  async function saveDraft(draft: Draft) {
    const res = await send<SaveResult>({ type: "save", draft }).catch((e) => ({ ok: false, error: String(e) }) as SaveResult);
    if (!res.ok) { toast(res.error || "Could not save."); return; }
    upsertLocal(res.highlight);
    if (res.existing) toast("Already highlighted. Click it to edit.");
    else if (res.queued) toast("Saved offline. It will sync when you're back online.");
    else {
      const cats = categoriesOf(res.highlight, categories);
      const label = cats.length ? `Saved to ${cats.map((c) => c.name).join(", ")}` : "Highlight saved";
      toast(label, { label: res.local ? "Open panel" : "View in library", run: () => void send({ type: res.local ? "openPanel" : "openLibrary" }) }, 5000);
    }
  }

  async function patchHighlight(h: Highlight, patch: HighlightPatch, message?: string) {
    upsertLocal({ ...h, ...patch }); // feel instant; the background confirms
    const res = await send<SaveResult>({ type: "update", id: h.id, patch });
    if (!res.ok) { toast(res.error || "Could not update the highlight."); void load(); return; }
    if (message) toast(res.queued ? `${message} offline. It will sync later.` : message);
  }

  async function deleteHighlight(h: Highlight) {
    const res = await send<{ ok: boolean }>({ type: "delete", id: h.id });
    if (!res.ok) { toast("Could not delete the highlight."); return; }
    highlights = highlights.filter((x) => x.id !== h.id);
    repaint();
    toast("Highlight deleted", {
      label: "Undo",
      run: async () => {
        const r = await send<SaveResult>({ type: "restore", highlight: h });
        if (r.ok) upsertLocal(h);
      },
    });
  }

  async function copyHighlight(h: Highlight) {
    const parts = [`“${h.selected_text.trim()}”`];
    if (h.note?.trim()) parts.push(`Note: ${h.note.trim()}`);
    parts.push(`— ${h.page_title || h.domain}\n${h.source_url}`);
    try { await navigator.clipboard.writeText(parts.join("\n\n")); toast("Copied"); }
    catch { toast("Could not copy on this page."); }
  }

  async function createCategory(name: string): Promise<Category | null> {
    const res = await send<CategoryResult>({ type: "createCategory", name });
    if (!res.ok) { toast(res.error); return null; }
    if (!categories.some((c) => c.id === res.category.id)) categories = [res.category, ...categories];
    return res.category;
  }

  // ---------- Category picker ----------
  /**
   * New highlight: clicking a category saves straight into it; ticking boxes picks several, then Save.
   * Existing highlight: every click toggles that category immediately.
   */
  function openPicker(anchor: DOMRect, opts: { selected: string[]; mode: "new" | "existing"; onApply: (ids: string[]) => void }) {
    closePicker();
    const chosen = new Set(opts.selected);
    const box = el("div", "picker");
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Choose categories");
    const input = el("input", "picker-input");
    input.placeholder = categories.length ? "Search or create a category" : "Name your first category";
    input.setAttribute("aria-label", "Search or create a category");
    const listEl = el("div", "picker-list");
    listEl.setAttribute("role", "listbox");
    const footer = el("div", "picker-footer");
    box.append(input, listEl, footer);
    let active = 0;
    let items: { run: () => void; toggle?: () => void }[] = [];

    const apply = (ids: string[]) => { closePicker(); opts.onApply(ids); };

    function render() {
      const q = input.value.trim().toLowerCase();
      const matches = categories.filter((c) => c.name.toLowerCase().includes(q));
      const exact = categories.some((c) => c.name.toLowerCase() === q);
      listEl.replaceChildren();
      items = [];
      for (const c of matches) {
        const row = el("div", "picker-row");
        row.setAttribute("role", "option");
        row.setAttribute("aria-selected", String(chosen.has(c.id)));
        const check = el("button", `check${chosen.has(c.id) ? " on" : ""}`);
        check.type = "button";
        check.title = chosen.has(c.id) ? `Remove ${c.name}` : `Also add ${c.name}`;
        check.setAttribute("aria-label", check.title);
        check.textContent = chosen.has(c.id) ? "✓" : "";
        const toggle = () => {
          if (chosen.has(c.id)) chosen.delete(c.id); else chosen.add(c.id);
          if (opts.mode === "existing") opts.onApply([...chosen]);
          render();
        };
        const pick = () => (opts.mode === "existing" ? toggle() : apply([c.id]));
        check.addEventListener("mousedown", (e) => e.preventDefault());
        check.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
        row.addEventListener("mousedown", (e) => e.preventDefault());
        row.addEventListener("click", pick);
        row.append(dot(c.color), el("span", "picker-name", c.name), check);
        listEl.append(row);
        items.push({ run: pick, toggle });
      }
      if (q && !exact) {
        const row = el("div", "picker-row create");
        row.setAttribute("role", "option");
        row.append(el("span", "plus", "+"), el("span", "picker-name", `Create “${input.value.trim()}”`));
        const create = async () => {
          const c = await createCategory(input.value.trim());
          if (!c) return;
          input.value = "";
          if (opts.mode === "existing") { chosen.add(c.id); opts.onApply([...chosen]); render(); }
          else if (chosen.size) { chosen.add(c.id); render(); }
          else apply([c.id]);
        };
        row.addEventListener("mousedown", (e) => e.preventDefault());
        row.addEventListener("click", () => void create());
        listEl.append(row);
        items.push({ run: () => void create() });
      }
      if (!items.length) listEl.append(el("p", "picker-empty", "Type a name to create a category."));
      active = Math.min(active, Math.max(0, items.length - 1));
      [...listEl.querySelectorAll(".picker-row")].forEach((r, i) => r.classList.toggle("active", i === active));

      footer.replaceChildren();
      if (opts.mode === "new" && chosen.size > 1) {
        footer.append(button(`Save to ${chosen.size} categories`, () => apply([...chosen]), "btn primary"));
      } else if (opts.mode === "new" && chosen.size === 1) {
        footer.append(button("Save", () => apply([...chosen]), "btn primary"));
      } else if (opts.mode === "existing") {
        footer.append(button("Done", closePicker, "btn"));
      }
      footer.hidden = !footer.childElementCount;
    }

    input.addEventListener("input", () => { active = 0; render(); });
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "ArrowDown") { active = Math.min(active + 1, items.length - 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { active = Math.max(active - 1, 0); render(); e.preventDefault(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (opts.mode === "new" && chosen.size && !input.value.trim()) apply([...chosen]);
        else items[active]?.run();
      } else if (e.key === " " && !input.value && items[active]?.toggle) { e.preventDefault(); items[active].toggle!(); }
      else if (e.key === "Escape") closePicker();
    });
    render();
    picker = box;
    place(box, anchor);
    input.focus({ preventScroll: true });
  }

  // ---------- UI panels ----------
  function showToolbar(range: Range) {
    closePanel();
    const draft = captureDraft(range, null);
    if (!draft) return;
    const existing = findExisting(range, draft);
    if (existing) { const r = painted.get(existing.id); if (r) { showPopover(existing, r); return; } }
    const bar = el("div", "toolbar");
    const categoryBtn = button("🏷 Category", () => {
      openPicker(bar.getBoundingClientRect(), {
        selected: [], mode: "new",
        onApply: (ids) => { closePanel(); clearSelection(); void saveDraft({ ...draft, category_ids: ids }); },
      });
    });
    categoryBtn.title = "Save into a category";
    bar.append(
      button("Save", () => { closePanel(); clearSelection(); void saveDraft(draft); }, "btn primary"),
      button("Note", () => showComposer(range, null, draft)),
      categoryBtn,
    );
    panel = bar;
    place(bar, range.getBoundingClientRect());
  }

  function showComposer(range: Range | null, existing: Highlight | null, draft?: Draft) {
    const rect = (range ?? (existing && painted.get(existing.id)))?.getBoundingClientRect();
    closePanel();
    if (!rect) return;
    if (existing) { const r = painted.get(existing.id); if (r) hlActive.add(r); }
    const box = el("div", "composer");
    const text = existing?.selected_text ?? draft?.selected_text ?? "";
    box.append(el("blockquote", "preview", text.length > 220 ? text.slice(0, 220) + "…" : text));
    const ta = el("textarea");
    ta.placeholder = "Add a note (optional)";
    ta.value = existing?.note ?? "";
    ta.rows = 3;

    // Categories chosen here are saved together with the note.
    let chosen = [...(existing?.category_ids ?? draft?.category_ids ?? [])];
    const catRow = el("div", "composer-cats");
    const renderCats = () => {
      catRow.replaceChildren();
      for (const c of categories.filter((x) => chosen.includes(x.id))) {
        const chip = el("button", "chip removable");
        chip.type = "button";
        chip.title = `Remove ${c.name}`;
        chip.append(dot(c.color), document.createTextNode(c.name), el("span", "x", "×"));
        chip.addEventListener("mousedown", (e) => e.preventDefault());
        chip.addEventListener("click", (e) => { e.stopPropagation(); chosen = chosen.filter((id) => id !== c.id); renderCats(); });
        catRow.append(chip);
      }
      const add = button(chosen.length ? "+ Category" : "🏷 Add category", () => {
        openPicker(box.getBoundingClientRect(), {
          selected: chosen, mode: "existing",
          onApply: (ids) => { chosen = ids; renderCats(); },
        });
      }, "btn chip-add");
      catRow.append(add);
    };
    renderCats();

    const submit = () => {
      closePanel();
      clearSelection();
      const note = ta.value.trim() || null;
      if (existing) {
        const sameCats = chosen.join() === (existing.category_ids ?? []).join();
        void patchHighlight(existing, sameCats ? { note } : { note, category_ids: chosen }, "Saved");
      } else if (draft) void saveDraft({ ...draft, note, category_ids: chosen });
    };
    ta.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
      if (e.key === "Escape") closePanel();
    });
    const actions = el("div", "actions");
    actions.append(button("Cancel", closePanel, "btn ghost"), button("Save", submit, "btn primary"));
    box.append(ta, catRow, actions);
    panel = box;
    place(box, rect);
    ta.focus();
  }

  /** Clicked an existing highlight: its categories, note, and Category / Note / Copy / Delete. */
  function showPopover(h: Highlight, range: Range) {
    closePanel();
    hlActive.add(range);
    const pop = el("div", "composer");
    const cats = categoriesOf(h, categories);
    if (cats.length) {
      const chips = el("div", "chips");
      for (const c of cats) { const chip = el("span", "chip"); chip.append(dot(c.color), document.createTextNode(c.name)); chips.append(chip); }
      pop.append(chips);
    }
    pop.append(el("p", h.note ? "note" : "note muted", h.note || "No note yet."));
    const actions = el("div", "actions spread");
    const catBtn = button("🏷 Category", () => {
      let current = h;
      openPicker(pop.getBoundingClientRect(), {
        selected: h.category_ids ?? [], mode: "existing",
        onApply: (ids) => { current = { ...current, category_ids: ids }; void patchHighlight(current, { category_ids: ids }); },
      });
    });
    actions.append(
      catBtn,
      button(h.note ? "Edit note" : "Add note", () => showComposer(range, h)),
      button("Copy", () => { closePanel(); void copyHighlight(h); }),
      button("Delete", () => { closePanel(); void deleteHighlight(h); }, "btn ghost"),
    );
    pop.append(actions);
    panel = pop;
    place(pop, range.getBoundingClientRect());
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
  }

  /** Scroll a highlight into view and flash it (from the side panel). */
  function scrollToHighlight(id: string): boolean {
    const r = painted.get(id);
    if (!r) return false;
    const target = r.startContainer.nodeType === Node.ELEMENT_NODE ? (r.startContainer as Element) : r.startContainer.parentElement;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    hlActive.clear();
    hlActive.add(r);
    setTimeout(() => { if (!panel) hlActive.clear(); }, 1600);
    return true;
  }

  /** Opened from the side panel's "All" view: jump to the chosen highlight once it is painted. */
  async function consumeJump() {
    try {
      const jump = (await chrome.storage.local.get(JUMP_KEY))[JUMP_KEY] as Jump | undefined;
      if (!jump || jump.canonical !== canonical || Date.now() - jump.at > 60_000) return;
      await chrome.storage.local.remove(JUMP_KEY);
      if (!scrollToHighlight(jump.id)) setTimeout(() => scrollToHighlight(jump.id), 1500);
    } catch { /* orphaned */ }
  }

  // ---------- Events ----------
  const isInsideUI = (e: Event) => e.composedPath().includes(host);

  function isEditable(node: Node | null): boolean {
    const e = node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
    return !!e?.closest("input, textarea, [contenteditable=''], [contenteditable='true']");
  }

  function onSelectionDone(e: Event) {
    if (isInsideUI(e)) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !sel.toString().trim()) return;
      const range = sel.getRangeAt(0);
      if (isEditable(range.commonAncestorContainer)) return;
      showToolbar(range.cloneRange());
    }, 10);
  }

  document.addEventListener("mouseup", onSelectionDone, true);
  document.addEventListener("keyup", (e) => { if (e.shiftKey || e.key === "Shift") onSelectionDone(e); }, true);

  document.addEventListener("mousedown", (e) => { if (!isInsideUI(e)) closePanel(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); }, true);
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (panel?.classList.contains("toolbar") && !picker && (!sel || sel.isCollapsed)) closePanel();
  });

  // Click on a saved highlight to see its note and categories.
  document.addEventListener("click", (e) => {
    if (isInsideUI(e) || painted.size === 0) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const pos = document.caretPositionFromPoint?.(e.clientX, e.clientY);
    const node = pos?.offsetNode, offset = pos?.offset;
    if (!node || offset === undefined) return;
    for (const [id, r] of painted) {
      try {
        if (r.isPointInRange(node, offset)) {
          const h = highlights.find((x) => x.id === id);
          if (h) showPopover(h, r);
          return;
        }
      } catch { /* ignore */ }
    }
  }, true);

  // Re-anchor when the page mutates (SPAs, lazy content), debounced.
  let mutationTimer: ReturnType<typeof setTimeout> | undefined;
  new MutationObserver((records) => {
    if (records.every((r) => host.contains(r.target) || r.target === pageStyle || pageStyle.contains(r.target))) return;
    if (highlights.length === 0) return;
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      const stale = [...painted.values()].some((r) => !r.startContainer.isConnected || r.collapsed);
      if (stale || unresolved.size > 0) repaint();
    }, 800);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  // SPA navigation: content scripts cannot hook the page's history API, so watch the URL.
  const urlTimer = setInterval(() => {
    if (!extensionAlive()) { teardown(); return; }
    const next = canonicalizeUrl(location.href);
    if (next !== canonical) {
      canonical = next;
      closePanel();
      highlights = [];
      repaint();
      void load();
    }
  }, 1000);

  // Pick up edits and deletions made in the web app or side panel.
  document.addEventListener("visibilitychange", () => {
    if (!extensionAlive()) { teardown(); return; }
    if (document.visibilityState === "visible") void load();
  });

  // The extension was reloaded: remove this orphaned copy's UI so the fresh one can take over.
  function teardown() {
    clearInterval(urlTimer);
    host.remove();
    pageStyle.remove();
    for (const [key, hl] of layers) { hl.clear(); CSS.highlights.delete(key); }
    hlActive.clear();
  }

  chrome.runtime.onMessage.addListener((msg: TabMessage, _sender, reply) => {
    if (msg.type === "refresh") void load();
    if (msg.type === "status") reply({ painted: painted.size, unresolved: unresolved.size, total: highlights.length, unresolvedIds: [...unresolved] } satisfies TabStatus);
    if (msg.type === "scrollTo") reply(scrollToHighlight(msg.id));
  });

  // On the Gather website: if the extension isn't signed in yet, borrow the website's sign-in.
  if (location.origin === new URL(__WEB_URL__).origin) {
    let asked = false;
    const askForSession = async () => {
      if (asked) return;
      const user = await send<unknown>({ type: "session" }).catch(() => "unknown");
      if (user) return; // already signed in (or unreachable)
      asked = true;
      window.postMessage({ source: "gather-ext", type: "needSession" }, location.origin);
    };
    window.addEventListener("message", (e: MessageEvent) => {
      if (e.source !== window || e.origin !== location.origin || e.data?.source !== "gather-web") return;
      if (e.data.type === "bridgeReady") void askForSession();
      if (e.data.type === "sessionToken" && typeof e.data.token_hash === "string") {
        void send<{ ok: boolean }>({ type: "adoptSession", tokenHash: e.data.token_hash }).then((r) => { if (r?.ok) void load(); });
      }
    });
    void askForSession();
  }

  void load().then(consumeJump);
}

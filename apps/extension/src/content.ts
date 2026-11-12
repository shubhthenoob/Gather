import { canonicalizeUrl, domainOf, findQuote, isSupportedUrl, normalizeText, CONTEXT_LENGTH, type Highlight } from "@highlight/shared";
import { buildIndex, offsetsToRange, rangeToOffsets, trimOffsets, xpathOf, UI_HOST_ID, type TextIndex } from "./anchor";
import { send, type Draft, type ListResult, type SaveResult, type TabMessage, type TabStatus } from "./messages";
import { UI_CSS, PAGE_CSS } from "./styles";

if (isSupportedUrl(location.href) && !document.getElementById(UI_HOST_ID)) main();

function main() {
  // ---------- State ----------
  let canonical = canonicalizeUrl(location.href);
  let highlights: Highlight[] = [];
  const painted = new Map<string, Range>();
  const unresolved = new Set<string>();
  let signedIn = true;

  // ---------- Page-level highlight painting (CSS Custom Highlight API, no DOM changes) ----------
  const hlA = new Highlight();
  const hlB = new Highlight();
  const hlActive = new Highlight();
  hlActive.priority = 1;
  CSS.highlights.set("hl-ext-a", hlA);
  CSS.highlights.set("hl-ext-b", hlB);
  CSS.highlights.set("hl-ext-active", hlActive);
  const pageStyle = document.createElement("style");
  pageStyle.textContent = PAGE_CSS;
  (document.head ?? document.documentElement).appendChild(pageStyle);

  // ---------- Shadow-DOM UI host, isolated from page styles ----------
  const host = document.createElement("div");
  host.id = UI_HOST_ID;
  host.style.cssText = "all: initial; position: absolute; top: 0; left: 0; z-index: 2147483647;";
  const shadow = host.attachShadow({ mode: "closed" });
  const style = document.createElement("style");
  style.textContent = UI_CSS;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);

  let panel: HTMLElement | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function closePanel() {
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

  function toast(message: string, action?: { label: string; run: () => void }) {
    shadow.querySelector(".toast")?.remove();
    clearTimeout(toastTimer);
    const t = el("div", "toast");
    t.append(el("span", "", message));
    if (action) t.append(button(action.label, () => { t.remove(); action.run(); }, "link"));
    shadow.appendChild(t);
    toastTimer = setTimeout(() => t.remove(), action ? 8000 : 2500);
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
    hlA.clear(); hlB.clear();
    painted.clear(); unresolved.clear();
    let index: TextIndex | null = null;
    const ordered: { id: string; range: Range }[] = [];
    for (const h of highlights) {
      index ??= buildIndex();
      const m = findQuote(index.text, { exact: h.selected_text, prefix: h.prefix, suffix: h.suffix, hint: h.anchor_data?.textOffset });
      const range = m ? offsetsToRange(index, m.start, m.end) : null;
      if (range) ordered.push({ id: h.id, range });
      else unresolved.add(h.id);
    }
    // Alternate two shades in document order so adjacent highlights stay distinguishable.
    ordered.sort((a, b) => a.range.compareBoundaryPoints(Range.START_TO_START, b.range));
    ordered.forEach(({ id, range }, i) => {
      painted.set(id, range);
      (i % 2 ? hlB : hlA).add(range);
    });
    void send({ type: "badge", painted: painted.size, unresolved: unresolved.size }).catch(() => {});
  }

  async function load() {
    try {
      const res = await send<ListResult>({ type: "list", canonicalUrl: canonical });
      signedIn = res.signedIn;
      highlights = res.highlights ?? [];
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
  async function withAuth<T extends SaveResult>(run: () => Promise<T>, retryLabel: string): Promise<T | null> {
    const res = await run().catch((e) => ({ ok: false, error: String(e) }) as T);
    if (!res.ok && "needsAuth" in res && res.needsAuth) {
      // Keep the captured draft in this closure; resume after sign-in.
      toast("Sign in with Google to save highlights.", {
        label: "Sign in",
        run: async () => {
          const auth = await send<{ ok: boolean; error?: string }>({ type: "signIn" });
          if (!auth.ok) { toast(auth.error ?? "Sign-in failed."); return; }
          signedIn = true;
          await load();
          toast(`Signed in. ${retryLabel}…`);
          const again = await run();
          if (again.ok) finishSave(again);
          else toast(("error" in again && again.error) || "Could not save.");
        },
      });
      return null;
    }
    if (!res.ok) { toast(("error" in res && res.error) || "Something went wrong."); return null; }
    return res;
  }

  function finishSave(res: Extract<SaveResult, { ok: true }>) {
    upsertLocal(res.highlight);
    if (res.existing) toast("Already highlighted. You can edit its note.");
    else toast(res.queued ? "Saved offline. It will sync when you're back online." : "Highlight saved");
  }

  async function saveDraft(draft: Draft) {
    const res = await withAuth(() => send<SaveResult>({ type: "save", draft }), "Saving your highlight");
    if (res && res.ok) finishSave(res);
  }

  async function updateNote(h: Highlight, note: string) {
    const res = await withAuth(() => send<SaveResult>({ type: "update", id: h.id, note: note.trim() || null }), "Updating note");
    if (res && res.ok) {
      upsertLocal({ ...h, note: note.trim() || null });
      toast(res.queued ? "Note saved offline. It will sync later." : "Note updated");
    }
  }

  async function deleteHighlight(h: Highlight) {
    const res = await send<{ ok: boolean }>({ type: "delete", id: h.id });
    if (!res.ok) { toast("Could not delete the highlight."); return; }
    highlights = highlights.filter((x) => x.id !== h.id);
    repaint();
    toast("Highlight removed");
  }

  // ---------- UI panels ----------
  function showToolbar(range: Range) {
    closePanel();
    const draft = captureDraft(range, null);
    if (!draft) return;
    const existing = findExisting(range, draft);
    const bar = el("div", "toolbar");
    if (existing) {
      bar.append(
        el("span", "label", "✓ Saved"),
        button(existing.note ? "Edit note" : "Add note", () => showComposer(range, existing)),
        button("Remove", () => { closePanel(); void deleteHighlight(existing); }, "btn ghost"),
      );
    } else {
      bar.append(
        button("Save Highlight", () => { closePanel(); clearSelection(); void saveDraft(draft); }, "btn primary"),
        button("Add Note", () => showComposer(range, null, draft)),
      );
    }
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
    const submit = () => {
      closePanel();
      clearSelection();
      if (existing) void updateNote(existing, ta.value);
      else if (draft) void saveDraft({ ...draft, note: ta.value.trim() || null });
    };
    ta.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
      if (e.key === "Escape") closePanel();
    });
    const actions = el("div", "actions");
    actions.append(button("Cancel", closePanel, "btn ghost"), button("Save", submit, "btn primary"));
    box.append(ta, actions);
    panel = box;
    place(box, rect);
    ta.focus();
  }

  function showPopover(h: Highlight, range: Range) {
    closePanel();
    hlActive.add(range);
    const pop = el("div", "composer");
    pop.append(el("p", h.note ? "note" : "note muted", h.note || "No note yet."));
    const actions = el("div", "actions");
    actions.append(
      button("Remove", () => { closePanel(); void deleteHighlight(h); }, "btn ghost"),
      button(h.note ? "Edit note" : "Add note", () => showComposer(range, h), "btn primary"),
    );
    pop.append(actions);
    panel = pop;
    place(pop, range.getBoundingClientRect());
  }

  function clearSelection() {
    window.getSelection()?.removeAllRanges();
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
      // Signed-out users still get the toolbar; saving prompts sign-in and keeps the draft.
      showToolbar(range.cloneRange());
    }, 10);
  }

  document.addEventListener("mouseup", onSelectionDone, true);
  document.addEventListener("keyup", (e) => { if (e.shiftKey || e.key === "Shift") onSelectionDone(e); }, true);

  document.addEventListener("mousedown", (e) => { if (!isInsideUI(e)) closePanel(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); }, true);
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (panel?.classList.contains("toolbar") && (!sel || sel.isCollapsed)) closePanel();
  });

  // Click on a saved highlight to see its note.
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
    if (records.every((r) => host.contains(r.target) || r.target === pageStyle)) return;
    if (highlights.length === 0) return;
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => {
      const stale = [...painted.values()].some((r) => !r.startContainer.isConnected || r.collapsed);
      if (stale || unresolved.size > 0) repaint();
    }, 800);
  }).observe(document.body, { childList: true, subtree: true, characterData: true });

  // SPA navigation: content scripts cannot hook the page's history API, so watch the URL.
  setInterval(() => {
    const next = canonicalizeUrl(location.href);
    if (next !== canonical) {
      canonical = next;
      closePanel();
      highlights = [];
      repaint();
      void load();
    }
  }, 1000);

  // Pick up edits and deletions made in the web app.
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void load(); });

  chrome.runtime.onMessage.addListener((msg: TabMessage, _sender, reply) => {
    if (msg.type === "refresh") void load();
    if (msg.type === "status") reply({ painted: painted.size, unresolved: unresolved.size, total: highlights.length } satisfies TabStatus);
  });

  void load();
}

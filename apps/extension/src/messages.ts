import type { Category, Highlight, NewHighlight } from "@highlight/shared";

export interface Draft extends NewHighlight {
  /** Client-generated id so offline retries are idempotent. */
  id: string;
}

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

export type HighlightPatch = { note?: string | null; category_ids?: string[] };
export type CategoryPatch = { name?: string; color?: string };

export type Request =
  | { type: "session" }
  | { type: "signIn" }
  | { type: "signOut" }
  | { type: "openLibrary" }
  | { type: "openPanel"; auto?: boolean }
  | { type: "list"; canonicalUrl: string }
  | { type: "listAll" }
  | { type: "save"; draft: Draft }
  | { type: "update"; id: string; patch: HighlightPatch }
  | { type: "delete"; id: string }
  | { type: "restore"; highlight: Highlight }
  | { type: "categories" }
  | { type: "createCategory"; name: string; color?: string }
  | { type: "updateCategory"; id: string; patch: CategoryPatch }
  | { type: "deleteCategory"; id: string }
  | { type: "badge"; painted: number; unresolved: number }
  | { type: "queueSize" }
  | { type: "localCount" }
  | { type: "adoptSession"; tokenHash: string };

export type SaveResult =
  | { ok: true; highlight: Highlight; queued?: boolean; existing?: boolean; local?: boolean }
  | { ok: false; needsAuth?: boolean; error?: string };

export type CategoryResult = { ok: true; category: Category } | { ok: false; error: string };

export type ListResult = { signedIn: boolean; highlights: Highlight[]; categories: Category[]; offline?: boolean };

/** Messages sent to a tab's content script. */
export type TabMessage =
  | { type: "refresh" }
  | { type: "status" }
  | { type: "scrollTo"; id: string };
export type TabStatus = { painted: number; unresolved: number; total: number; unresolvedIds: string[] };

/** Broadcast from the background to extension pages (the side panel) after any change. */
export type PanelMessage = { type: "changed" };

/** Set while the user has closed the side panel; saving then stops reopening it. */
export const PANEL_CLOSED_KEY = "panelClosed";

/** Storage key for "scroll to this highlight once the page opens". */
export const JUMP_KEY = "jump";
export type Jump = { canonical: string; id: string; at: number };

/** True while this script still belongs to the installed extension (false after a reload/update). */
export function extensionAlive(): boolean {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

export function send<T>(msg: Request): Promise<T> {
  // After the extension is reloaded, scripts left in open tabs throw synchronously here.
  try {
    // Orphaned copy: never settle, so no caller surfaces an "Uncaught (in promise)" error.
    if (!extensionAlive()) return new Promise<T>(() => {});
    return chrome.runtime.sendMessage(msg) as Promise<T>;
  } catch {
    return new Promise<T>(() => {});
  }
}

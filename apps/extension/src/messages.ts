import type { Highlight, NewHighlight } from "@highlight/shared";

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

export type Request =
  | { type: "session" }
  | { type: "signIn" }
  | { type: "signOut" }
  | { type: "list"; canonicalUrl: string }
  | { type: "save"; draft: Draft }
  | { type: "update"; id: string; note: string | null }
  | { type: "delete"; id: string }
  | { type: "badge"; painted: number; unresolved: number }
  | { type: "queueSize" };

export type SaveResult =
  | { ok: true; highlight: Highlight; queued?: boolean; existing?: boolean }
  | { ok: false; needsAuth?: boolean; error?: string };

export type ListResult = { signedIn: boolean; highlights: Highlight[]; offline?: boolean };

/** Messages the background or popup send to a tab's content script. */
export type TabMessage = { type: "refresh" } | { type: "status" };
export type TabStatus = { painted: number; unresolved: number; total: number };

export function send<T>(msg: Request): Promise<T> {
  return chrome.runtime.sendMessage(msg) as Promise<T>;
}

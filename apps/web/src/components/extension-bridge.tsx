"use client";
import { useEffect } from "react";

/**
 * Lets the Gather extension pick up the website's sign-in. The extension's content script posts
 * { source: "gather-ext", type: "needSession" } on this page; we answer with a one-time token.
 */
export function ExtensionBridge() {
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      if (e.source !== window || e.origin !== window.location.origin) return;
      if (e.data?.source !== "gather-ext" || e.data?.type !== "needSession") return;
      try {
        const res = await fetch("/api/extension-token", { method: "POST" });
        if (!res.ok) return;
        const { token_hash, email } = await res.json();
        window.postMessage({ source: "gather-web", type: "sessionToken", token_hash, email }, window.location.origin);
      } catch {
        /* the extension will simply ask the user to sign in */
      }
    };
    window.addEventListener("message", onMessage);
    // Tell an already-loaded content script we are ready to answer.
    window.postMessage({ source: "gather-web", type: "bridgeReady" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}

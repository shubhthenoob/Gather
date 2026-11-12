"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes server-rendered data when highlights or notes change elsewhere,
 * e.g. a save from the Chrome extension or another device.
 */
export function RealtimeRefresh({ userId }: { userId: string }) {
  const router = useRouter();
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      clearTimeout(t.current);
      t.current = setTimeout(() => {
        // Do not clobber a note being typed in.
        const el = document.activeElement;
        if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) return;
        router.refresh();
      }, 400);
    };
    const channel = supabase
      .channel(`user-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "highlights", filter: `user_id=eq.${userId}` }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notes", filter: `user_id=eq.${userId}` }, refresh)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notes", filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { supabase.removeChannel(channel); window.removeEventListener("focus", onFocus); clearTimeout(t.current); };
  }, [userId, router]);
  return null;
}

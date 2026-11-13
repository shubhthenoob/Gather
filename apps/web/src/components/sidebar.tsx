"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions";
import { formatDay, todayIn, type DayPage } from "@highlight/shared";

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="bordered panel flex w-full items-center gap-2 rounded-full border px-4 py-2.5 shadow-sm focus-within:border-[var(--accent)]"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="muted shrink-0"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your highlights and notes" className="w-full text-sm" aria-label="Search highlights and notes" />
    </form>
  );
}

export function Sidebar(props: { days: DayPage[]; timezone: string; name: string; email: string; avatar: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const today = todayIn(props.timezone);
  const pastDays = props.days.filter((d) => d.day !== today);
  const active = (href: string) => pathname === href || (href === `/day/${today}` && pathname === "/day/today");
  const item = (href: string, label: React.ReactNode, count?: number) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={`flex items-center justify-between rounded-r-full py-1.5 pl-4 pr-3 text-sm ${active(href) ? "bg-[var(--mark)] font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
    >
      <span className="truncate">{label}</span>
      {count ? <span className="muted text-xs">{count}</span> : null}
    </Link>
  );
  const todayCount = props.days.find((d) => d.day === today);

  return (
    <aside className="bordered panel border-b md:flex md:h-screen md:w-64 md:flex-col md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/day/today" className="flex items-center gap-2 text-lg font-semibold">
          <img src="/icon.svg" alt="" className="h-7 w-7" /> Gather
        </Link>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      <div className={`${open ? "flex" : "hidden"} flex-col md:flex md:min-h-0 md:flex-1`}>
        <nav className="flex-1 overflow-y-auto pb-4 pr-3">
          {item("/day/today", "Today", todayCount ? Number(todayCount.highlight_count) + Number(todayCount.note_count) : undefined)}
          {pastDays.length > 0 && <p className="muted px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wider">Pages</p>}
          {pastDays.map((d) => item(`/day/${d.day}`, formatDay(d.day), Number(d.highlight_count) + Number(d.note_count)))}
        </nav>
        <AccountMenu name={props.name} email={props.email} avatar={props.avatar} onNavigate={() => setOpen(false)} />
      </div>
    </aside>
  );
}

/** Profile button that opens a small menu with Settings and Sign out. */
function AccountMenu(props: { name: string; email: string; avatar: string | null; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const row = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10";
  return (
    <div ref={ref} className="bordered relative border-t p-3">
      {open && (
        <div role="menu" className="bordered panel absolute bottom-full left-3 right-3 mb-2 rounded-xl border p-1 shadow-lg">
          <Link href="/settings" role="menuitem" className={row} onClick={() => { setOpen(false); props.onNavigate(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
            Settings
          </Link>
          <form action={signOut}>
            <button role="menuitem" className={`${row} text-red-600 dark:text-red-400`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
              Sign out
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"
      >
        {props.avatar ? <img src={props.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" /> : <div className="h-8 w-8 rounded-full bg-[var(--accent)]" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{props.name}</p>
          <p className="muted truncate text-xs">{props.email}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`muted shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
      </button>
    </div>
  );
}

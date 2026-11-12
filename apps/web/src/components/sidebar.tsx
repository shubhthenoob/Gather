"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { formatDay, todayIn, type DayPage } from "@highlight/shared";

function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className="bordered panel flex items-center gap-2 rounded-lg border px-3 py-2"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="muted shrink-0"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full text-sm" aria-label="Search highlights and notes" />
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
    <aside className="bordered panel border-b md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/day/today" className="flex items-center gap-2 text-lg font-semibold">
          <img src="/icon.svg" alt="" className="h-7 w-7" /> Highlight
        </Link>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>
      <div className={`${open ? "flex" : "hidden"} flex-col md:flex md:h-[calc(100vh-64px)]`}>
        <div className="px-4 pb-3"><Suspense><SearchBox /></Suspense></div>
        <nav className="flex-1 overflow-y-auto pb-4 pr-3">
          {item("/day/today", "Today", todayCount ? Number(todayCount.highlight_count) + Number(todayCount.note_count) : undefined)}
          {pastDays.length > 0 && <p className="muted px-4 pb-1 pt-4 text-xs font-medium uppercase tracking-wider">Pages</p>}
          {pastDays.map((d) => item(`/day/${d.day}`, formatDay(d.day), Number(d.highlight_count) + Number(d.note_count)))}
        </nav>
        <div className="bordered space-y-1 border-t p-3">
          {item("/settings", "Settings")}
          <div className="flex items-center gap-3 px-4 py-2">
            {props.avatar ? <img src={props.avatar} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" /> : <div className="h-8 w-8 rounded-full bg-[var(--accent)]" />}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{props.name}</p>
              <p className="muted truncate text-xs">{props.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

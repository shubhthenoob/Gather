import Link from "next/link";
import { AUDIENCES } from "@/lib/audiences";
import { STORE_URL } from "@/lib/site";

export function AddToChrome({ className = "", label = "Add to Chrome, it's free" }: { className?: string; label?: string }) {
  return (
    <a
      href={STORE_URL}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-black shadow-sm transition hover:brightness-110 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M21.2 8H12M3.9 6.1 8.5 14M10.9 21.9 15.5 14" /></svg>
      {label}
    </a>
  );
}

export function MarketingHeader() {
  return (
    <header className="bordered sticky top-0 z-20 border-b bg-[var(--bg)]">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <img src="/icon.svg" alt="" className="h-7 w-7" /> Gather
        </Link>
        <nav className="flex flex-1 items-center gap-5 text-sm">
          <Link href="/guide" className="muted hover:text-[var(--text)]">How to use</Link>
          <Link href="/blog" className="muted hover:text-[var(--text)]">Blog</Link>
        </nav>
        <Link href="/login" className="hidden text-sm font-medium sm:inline">Sign in</Link>
        <a href={STORE_URL} target="_blank" rel="noopener" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:brightness-110">Add to Chrome</a>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bordered mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-5 w-5" />
          <span className="font-semibold">Gather</span>
          <span className="muted">· Keep what matters. Find it later.</span>
        </div>
        <nav className="muted flex flex-wrap gap-x-5 gap-y-2" aria-label="Gather for">
          {AUDIENCES.map((a) => <Link key={a.slug} href={`/for/${a.slug}`} className="hover:underline">For {a.name.toLowerCase()}</Link>)}
        </nav>
        <nav className="muted flex flex-wrap gap-5">
          <Link href="/guide" className="hover:underline">How to use</Link>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <a href={STORE_URL} target="_blank" rel="noopener" className="hover:underline">Chrome Web Store</a>
        </nav>
      </div>
    </footer>
  );
}

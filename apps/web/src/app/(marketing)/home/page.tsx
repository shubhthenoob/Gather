import type { Metadata } from "next";
import Link from "next/link";
import { AddToChrome } from "@/components/marketing";
import { AUDIENCES } from "@/lib/audiences";
import { POSTS } from "@/lib/posts";
import { SITE_URL, STORE_URL } from "@/lib/site";

// Served at "/" for signed-out visitors (the middleware rewrites "/" here).
export const metadata: Metadata = {
  title: "Gather: Free Chrome Highlighter for Any Website, Find Your Highlights Later",
  description:
    "Gather is a free Chrome extension to highlight text on any web page, add notes, and keep everything in a searchable library organised by date. Keep what matters. Find it later.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  { title: "Highlight on any page", body: "Select text on any website and save it in one click. Your highlights reappear whenever you come back to the page." },
  { title: "Notes beside your highlights", body: "Add a thought while it's fresh. Notes sit right next to the text they belong to." },
  { title: "Organised for you", body: "Everything lands in a library sorted by day and by website. No folders, no tags, no filing." },
  { title: "Search everything", body: "Find any highlight or note in seconds by a word you remember, the site, or the day you read it." },
  { title: "Copy with the source", body: "Copy a quote with your note and its link attached, ready to paste into a doc or message." },
  { title: "Private by default", body: "Your library is yours alone. Nothing is saved unless you click Save, and you can export it all as Markdown." },
];

const FAQ = [
  { q: "Is Gather free?", a: "Yes. Gather is free to install and use." },
  { q: "Does Gather change the websites I highlight?", a: "No. Highlights are drawn on top of the page without modifying it, so sites keep working exactly as before." },
  { q: "Where are my highlights stored?", a: "In your private Gather library at gatherme.vercel.app, tied to your Google account. Only you can see it." },
  { q: "Can I export my highlights?", a: "Yes. You can export any day, or everything, as a Markdown file." },
  { q: "Which browsers are supported?", a: "Gather works in Google Chrome and other Chromium browsers that install extensions from the Chrome Web Store, such as Edge and Brave." },
];

export default function LandingPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Gather",
      applicationCategory: "BrowserApplication",
      operatingSystem: "Chrome",
      description: "Highlight text on any website, add notes, and find everything later in a searchable library.",
      url: SITE_URL,
      downloadUrl: STORE_URL,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 text-center sm:pt-24">
        <p className="muted mb-4 text-sm font-medium uppercase tracking-widest">Free Chrome extension</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Keep what matters. <span className="mark whitespace-nowrap">Find it later.</span>
        </h1>
        <p className="muted mx-auto mt-6 max-w-2xl text-lg">
          Highlight text on any website, add a note, and Gather keeps it in one searchable library, organised by date. Never lose a great line again.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <AddToChrome />
          <Link href="/guide" className="bordered rounded-full border px-6 py-3 font-medium hover:bg-black/5 dark:hover:bg-white/5">See how it works</Link>
        </div>
        <img
          src="/screens/screenshot-1.png"
          alt="Highlighting text on a web page with Gather: the Save toolbar and saved yellow highlights"
          width={1280}
          height={800}
          className="bordered mx-auto mt-14 w-full max-w-5xl rounded-2xl border shadow-2xl"
        />
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Select", "Highlight any text while you read. A small toolbar appears."],
            ["Save", "Click Save, add a note, or pick a category. It is highlighted in that colour on the page."],
            ["Find", "Open your library to browse by day or search everything you've saved."],
          ].map(([t, b], i) => (
            <div key={t} className="card p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] font-bold text-black">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="muted mt-1">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library showcase */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold">Everything lands in your library</h2>
          <p className="muted mt-4 text-lg">Your highlights are grouped by the day you read them and the site they came from, with your notes right beside each one. Open the original page in one click.</p>
        </div>
        <img src="/screens/screenshot-2.png" alt="The Gather library showing highlights and notes organised by date" width={1280} height={800} className="bordered w-full rounded-xl border shadow-xl" loading="lazy" />
      </section>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <img src="/screens/screenshot-3.png" alt="Searching highlights and notes in Gather" width={1280} height={800} className="bordered w-full rounded-xl border shadow-xl md:order-none order-last" loading="lazy" />
        <div>
          <h2 className="text-3xl font-bold">Find any highlight in seconds</h2>
          <p className="muted mt-4 text-lg">Remember one word? That's enough. Search across every highlight and note you've ever saved, and copy it with the source attached.</p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Built for people who read</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="muted mt-2 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-center text-3xl font-bold">Made for how you read</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <Link key={a.slug} href={`/for/${a.slug}`} className="card block p-5">
              <p className="font-semibold">For {a.name.toLowerCase()}</p>
              <p className="muted mt-1 text-sm">{a.headline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Blog teaser */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-bold">From the blog</h2>
          <Link href="/blog" className="muted text-sm hover:underline">All articles ›</Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {POSTS.slice(0, 3).map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card block p-6">
              <h3 className="font-semibold leading-snug">{p.title}</h3>
              <p className="muted mt-2 line-clamp-3 text-sm">{p.description}</p>
              <p className="muted mt-4 text-xs">{p.minutes} min read</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold">Questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="card group p-5">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="muted mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card px-6 py-14 text-center">
          <h2 className="text-3xl font-bold">Start keeping what matters</h2>
          <p className="muted mx-auto mt-3 max-w-xl">Install Gather in a few seconds. Your next great find is one highlight away.</p>
          <AddToChrome className="mt-8" />
        </div>
      </section>
    </main>
  );
}

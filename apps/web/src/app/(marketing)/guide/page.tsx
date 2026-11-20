import type { Metadata } from "next";
import Link from "next/link";
import { AddToChrome } from "@/components/marketing";
import { STORE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Use Gather: Highlight, Save and Search Web Pages",
  description: "A step-by-step guide to Gather: install the Chrome extension, highlight text on any website, add notes, and find everything in your library.",
  alternates: { canonical: "/guide" },
};

const STEPS: { title: string; body: React.ReactNode; img?: { src: string; alt: string } }[] = [
  {
    title: "Install the extension",
    body: <>Open Gather on the <a href={STORE_URL} target="_blank" rel="noopener" className="underline">Chrome Web Store</a> and click <strong>Add to Chrome</strong>. Pin it from the puzzle-piece menu so it&apos;s always one click away.</>,
  },
  {
    title: "Start right away",
    body: <>After installing, a welcome page opens the Gather side panel. You can highlight straight away with no account: highlights stay on your device. Click <strong>Sign in with Google</strong> in the panel whenever you want them synced to your private library; anything you saved before is moved across.</>,
  },
  {
    title: "Highlight text on any page",
    body: <>Select some text while you read. A small toolbar appears: click <strong>Save</strong> and the text turns yellow, or click <strong>🏷 Category</strong> to file it in a colour-coded category. Come back to the page later and your highlights are still there.</>,
    img: { src: "/screens/screenshot-1.png", alt: "Selecting text and clicking Save in Gather" },
  },
  {
    title: "Add a note",
    body: <>Click <strong>Add Note</strong> instead of Save to write a thought alongside the highlight. To add or edit a note later, click an existing highlight on the page.</>,
  },
  {
    title: "Open your library",
    body: <>Click the Gather icon in Chrome's toolbar (or press <strong>Alt+G</strong>) to open the side panel with this page's highlights, categories and search. For the full library, click <strong>Open library</strong> in the panel, or visit <Link href="/" className="underline">gatherme.vercel.app</Link>. Highlights are grouped by day and by website.</>,
    img: { src: "/screens/screenshot-2.png", alt: "The Gather library organised by date" },
  },
  {
    title: "Search and copy",
    body: <>Use the search bar to find any highlight or note by a word you remember. Hover a card and click the copy button to copy the quote with your note and its source link.</>,
    img: { src: "/screens/screenshot-3.png", alt: "Searching highlights in Gather" },
  },
  {
    title: "Export when you need to",
    body: <>Use <strong>Export day</strong> on any day page, or export everything from Settings, to get a Markdown file you can keep or move into other tools.</>,
  },
];

export default function GuidePage() {
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to highlight web pages and find them later with Gather",
    step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title })),
  };
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <h1 className="text-4xl font-bold tracking-tight">How to use Gather</h1>
      <p className="muted mt-4 text-lg">Get from install to your first saved highlight in under a minute.</p>

      <ol className="mt-12 space-y-12">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex gap-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-bold text-black">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <p className="muted mt-2 leading-relaxed">{s.body}</p>
              {s.img && <img src={s.img.src} alt={s.img.alt} width={1280} height={800} loading="lazy" className="bordered mt-5 w-full rounded-xl border shadow-lg" />}
            </div>
          </li>
        ))}
      </ol>

      <div className="card mt-16 p-8 text-center">
        <h2 className="text-2xl font-bold">Ready to try it?</h2>
        <AddToChrome className="mt-6" />
      </div>
    </main>
  );
}

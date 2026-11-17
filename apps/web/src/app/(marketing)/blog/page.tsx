import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Gather Blog: Reading, Highlighting and Remembering",
  description: "Practical guides on highlighting web pages, saving quotes, and remembering what you read online.",
  alternates: { canonical: "/blog" },
};

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default function BlogIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="muted mt-4 text-lg">Guides on reading well, highlighting smarter, and remembering more of what you read.</p>
      <div className="mt-12 space-y-6">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card block p-6">
            <p className="muted text-xs">{fmt(p.date)} · {p.minutes} min read</p>
            <h2 className="mt-2 text-xl font-semibold">{p.title}</h2>
            <p className="muted mt-2">{p.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

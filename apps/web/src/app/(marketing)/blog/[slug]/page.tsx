import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToChrome } from "@/components/marketing";
import { getPost, POSTS } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: `${post.title} · Gather`,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date },
  };
}

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const others = POSTS.filter((p) => p.slug !== post.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    publisher: { "@type": "Organization", name: "Gather", logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` } },
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/blog" className="muted text-sm hover:underline">‹ All articles</Link>
      <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight">{post.title}</h1>
      <p className="muted mt-3 text-sm">{fmt(post.date)} · {post.minutes} min read</p>

      <article className="mt-10 space-y-8 text-[17px] leading-relaxed">
        {post.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="mb-3 text-2xl font-semibold">{s.heading}</h2>}
            {s.paragraphs.map((p, j) => <p key={j} className="mb-4">{p}</p>)}
            {s.list && <ul className="list-disc space-y-2 pl-6">{s.list.map((l, j) => <li key={j}>{l}</li>)}</ul>}
          </section>
        ))}
      </article>

      <div className="card mt-14 p-8 text-center">
        <h2 className="text-2xl font-bold">Try Gather for free</h2>
        <p className="muted mt-2">Highlight text on any website and find it again in seconds.</p>
        <AddToChrome className="mt-6" />
      </div>

      <div className="mt-14">
        <h2 className="text-lg font-semibold">Keep reading</h2>
        <div className="mt-4 space-y-3">
          {others.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card block p-4">
              <p className="font-medium">{p.title}</p>
              <p className="muted mt-1 text-sm">{p.minutes} min read</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToChrome } from "@/components/marketing";
import { AUDIENCES, getAudience } from "@/lib/audiences";
import { POSTS } from "@/lib/posts";

export function generateStaticParams() {
  return AUDIENCES.map((a) => ({ audience: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ audience: string }> }): Promise<Metadata> {
  const a = getAudience((await params).audience);
  if (!a) return {};
  return { title: a.title, description: a.description, alternates: { canonical: `/for/${a.slug}` } };
}

export default async function AudiencePage({ params }: { params: Promise<{ audience: string }> }) {
  const a = getAudience((await params).audience);
  if (!a) notFound();
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: a.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-16 text-center">
        <p className="muted mb-4 text-sm font-medium uppercase tracking-widest">Gather for {a.name}</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{a.headline}</h1>
        <p className="muted mx-auto mt-5 max-w-2xl text-lg">{a.intro}</p>
        <AddToChrome className="mt-8" />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-bold">Sound familiar?</h2>
        <ul className="mt-4 space-y-2">
          {a.pains.map((p) => <li key={p} className="muted flex gap-2"><span aria-hidden="true">✕</span>{p}</li>)}
        </ul>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-bold">How Gather helps {a.name.toLowerCase()}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {a.benefits.map((b) => (
            <div key={b.title} className="card p-5">
              <h3 className="font-semibold">{b.title}</h3>
              <p className="muted mt-2 text-sm leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-bold">A simple workflow</h2>
        <ol className="mt-5 space-y-4">
          {a.workflow.map((w, i) => (
            <li key={w} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-bold text-black">{i + 1}</span>
              <p className="pt-1">{w}</p>
            </li>
          ))}
        </ol>
        <img src="/screens/screenshot-2.png" alt={`The Gather library used by ${a.name.toLowerCase()}`} width={1280} height={800} loading="lazy" className="bordered mt-8 w-full rounded-xl border shadow-lg" />
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-2xl font-bold">Questions</h2>
        <div className="mt-5 space-y-3">
          {a.faq.map((f) => (
            <details key={f.q} className="card p-5">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="muted mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <h2 className="text-lg font-semibold">Related reading</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {POSTS.slice(0, 4).map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="card block p-4">
              <p className="font-medium">{p.title}</p>
              <p className="muted mt-1 text-sm">{p.minutes} min read</p>
            </Link>
          ))}
        </div>
        <p className="muted mt-6 text-sm">
          Gather is also built for{" "}
          {AUDIENCES.filter((x) => x.slug !== a.slug).map((x, i, arr) => (
            <span key={x.slug}><Link href={`/for/${x.slug}`} className="underline">{x.name.toLowerCase()}</Link>{i < arr.length - 1 ? ", " : "."}</span>
          ))}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="card p-10 text-center">
          <h2 className="text-2xl font-bold">Try Gather free</h2>
          <AddToChrome className="mt-6" />
        </div>
      </section>
    </main>
  );
}

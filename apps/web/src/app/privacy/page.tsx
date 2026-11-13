import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy · Gather" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-[15px] leading-relaxed">
      <Link href="/login" className="muted text-sm hover:underline">‹ Gather</Link>
      <h1 className="mb-1 mt-4 text-3xl font-semibold">Privacy Policy</h1>
      <p className="muted mb-8 text-sm">Last updated: November 13, 2026</p>

      <div className="space-y-6">
        <section>
          <h2 className="mb-2 text-lg font-semibold">What Gather is</h2>
          <p>Gather is a personal tool for saving text highlights and notes from webpages and finding them later. It consists of a Chrome extension and a web app at gatherme.vercel.app.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">What we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Account details</strong> from Google sign-in: your name, email address and profile picture.</li>
            <li><strong>Content you choose to save</strong>: the text you highlight, notes you write, and the page&apos;s address, title and website name, plus a little surrounding text so the highlight can be found again on the page.</li>
            <li><strong>Settings</strong>, such as your timezone.</li>
          </ul>
          <p className="mt-2">The extension only reads a page&apos;s text when you select text on it, and only to show your saved highlights there. It does not track your browsing history, and nothing is saved unless you click Save.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">How it is used</h2>
          <p>Your data is used only to provide Gather to you: storing your highlights and notes, showing them in your library and on the original pages, and searching them. We do not sell your data, use it for advertising, or share it with anyone except the services that run Gather.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Where it is stored</h2>
          <p>Data is stored with Supabase (database and sign-in) and the web app is hosted on Vercel. Every record is private to your account and protected by row-level security, so other users cannot read it. The extension also keeps a local copy in your browser so it works offline.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Your choices</h2>
          <p>You can edit or delete any highlight or note at any time, and export everything as Markdown from the web app. Signing out removes your session from the browser. To delete your account and all of its data, email us at the address below.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Contact</h2>
          <p>Questions or deletion requests: email <a className="underline" href="mailto:shubhradia33@gmail.com">shubhradia33@gmail.com</a>, or open an issue at <a className="underline" href="https://github.com/shubhthenoob/Gather/issues">github.com/shubhthenoob/Gather</a>.</p>
        </section>
      </div>
    </main>
  );
}

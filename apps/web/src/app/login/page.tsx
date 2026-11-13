import Link from "next/link";
import { SignInButton } from "./sign-in-button";

const STEPS = [
  { title: "Select text on any page", body: "Highlight a passage while you read, then click Save Highlight. Add a note if you like." },
  { title: "It lands here, by date", body: "Every highlight is saved to this library, grouped by day and by website." },
  { title: "Find it later", body: "Search your highlights and notes, or open the purple tab on the right edge of any page." },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; welcome?: string }> }) {
  const { error, welcome } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <img src="/icon.svg" alt="" className="mx-auto mb-4 h-12 w-12" />
          <h1 className="text-2xl font-semibold">{welcome ? "Welcome to Gather" : "Gather"}</h1>
          <p className="muted mt-2 text-sm">
            {welcome ? "The extension is installed. Sign in once, and this is where your highlights will live." : "Keep what matters. Find it later."}
          </p>
        </div>

        <ol className="mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-black">{i + 1}</span>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="muted text-sm">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="text-center">
          <SignInButton />
          {error && <p className="mt-4 text-sm text-red-600">Sign-in failed. Please try again.</p>}
          <p className="muted mt-6 text-xs">
            Bookmark <strong>gatherme.vercel.app</strong> to come back anytime · <Link href="/privacy" className="underline">Privacy</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

import { SignInButton } from "./sign-in-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8 text-center">
        <img src="/icon.svg" alt="" className="mx-auto mb-4 h-12 w-12" />
        <h1 className="text-2xl font-semibold">Gather</h1>
        <p className="muted mt-2 text-sm">Keep what matters. Find it later.</p>
        <SignInButton />
        {error && <p className="mt-4 text-sm text-red-600">Sign-in failed. Please try again.</p>}
      </div>
    </main>
  );
}

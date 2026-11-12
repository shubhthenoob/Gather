import { requireUser } from "@/lib/supabase/server";
import { setTimezone, signOut } from "@/app/actions";

export default async function SettingsPage() {
  const { profile, user } = await requireUser();
  const zones = Intl.supportedValuesOf("timeZone");
  if (!zones.includes(profile.timezone)) zones.unshift(profile.timezone);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="card p-5">
        <h2 className="font-medium">Timezone</h2>
        <p className="muted mb-3 text-sm">Daily pages are grouped by this timezone. Changing it regroups everything.</p>
        <form action={setTimezone} className="flex gap-2">
          <select name="timezone" defaultValue={profile.timezone} className="bordered flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm">
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black">Save</button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-medium">Export</h2>
        <p className="muted mb-3 text-sm">Download every highlight and note as a Markdown file.</p>
        <a href="/api/export" className="bordered inline-block rounded-lg border px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5">Export all as Markdown</a>
      </section>

      <section className="card p-5">
        <h2 className="font-medium">Chrome extension</h2>
        <p className="muted text-sm">Sign in from the extension popup with the same Google account ({user.email}). Highlights sync automatically.</p>
      </section>

      <section className="card flex items-center justify-between p-5">
        <div>
          <h2 className="font-medium">Account</h2>
          <p className="muted text-sm">{user.email}</p>
        </div>
        <form action={signOut}><button className="bordered rounded-lg border px-4 py-2 text-sm">Sign out</button></form>
      </section>
    </div>
  );
}

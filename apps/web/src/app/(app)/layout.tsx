import { requireUser } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import type { DayPage } from "@highlight/shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireUser();
  const { data } = await supabase.rpc("day_pages");
  const days = (data ?? []) as DayPage[];
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        days={days}
        timezone={profile.timezone}
        name={profile.name ?? user.email ?? ""}
        email={user.email ?? ""}
        avatar={(user.user_metadata?.avatar_url as string | undefined) ?? null}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-10">{children}</main>
      <RealtimeRefresh userId={user.id} />
    </div>
  );
}

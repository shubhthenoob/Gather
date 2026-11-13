import { requireUser } from "@/lib/supabase/server";
import { Suspense } from "react";
import { Sidebar, SearchBox } from "@/components/sidebar";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import type { DayPage } from "@highlight/shared";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireUser();
  const { data } = await supabase.rpc("day_pages");
  const days = (data ?? []) as DayPage[];
  return (
    <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar
        days={days}
        timezone={profile.timezone}
        name={profile.name ?? user.email ?? ""}
        email={user.email ?? ""}
        avatar={(user.user_metadata?.avatar_url as string | undefined) ?? null}
      />
      <div className="flex min-w-0 flex-1 flex-col md:overflow-y-auto">
        <header className="bordered panel sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 md:px-10">
          <div className="max-w-xl flex-1"><Suspense><SearchBox /></Suspense></div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 md:px-10">{children}</main>
      </div>
      <RealtimeRefresh userId={user.id} />
    </div>
  );
}

import { ClientDashboard, type ClientPause, type ClientSession } from "@/app/client/client-dashboard";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const { supabase, profile } = await requireRole("client");

  const [{ data: sessions, error: sessionsError }, { data: pauses, error: pausesError }] =
    await Promise.all([
      supabase
        .from("work_sessions_client_view")
        .select("worker_id, work_type, start_time, end_time")
        .order("start_time", { ascending: false })
        .returns<ClientSession[]>(),
      supabase
        .from("pauses_client_view")
        .select("worker_id, start_time, end_time")
        .order("start_time", { ascending: false })
        .returns<ClientPause[]>()
    ]);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  if (pausesError) {
    throw new Error(pausesError.message);
  }

  return <ClientDashboard fullName={profile.full_name} pauses={pauses ?? []} sessions={sessions ?? []} />;
}

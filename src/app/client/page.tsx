import { ClientDashboard, type ClientSession } from "@/app/client/client-dashboard";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const { supabase, profile } = await requireRole("client");

  const { data: sessions, error } = await supabase
    .from("work_sessions_client_view")
    .select("worker_id, work_type, start_time, end_time")
    .order("start_time", { ascending: false })
    .returns<ClientSession[]>();

  if (error) {
    throw new Error(error.message);
  }

  return <ClientDashboard fullName={profile.full_name} sessions={sessions ?? []} />;
}


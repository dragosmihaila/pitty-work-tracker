import { ClientDashboard, type ClientPause, type ClientSession } from "@/app/client/client-dashboard";
import { requireRole } from "@/lib/auth";
import { APP_TIME_ZONE } from "@/lib/config";
import { getTodayRangeForTimeZone } from "@/lib/time-zone";

export const dynamic = "force-dynamic";

export default async function ClientPage() {
  const { supabase, profile } = await requireRole("client");
  const todayRange = getTodayRangeForTimeZone(APP_TIME_ZONE);

  const [
    { data: sessions, error: sessionsError },
    { data: todaySessions, error: todaySessionsError },
    { data: timelineSessions, error: timelineSessionsError },
    { data: timelinePauses, error: timelinePausesError },
    { data: pauses, error: pausesError }
  ] =
    await Promise.all([
      supabase
        .from("work_sessions_client_view")
        .select("worker_id, full_name, work_type, start_time, end_time")
        .order("start_time", { ascending: false })
        .returns<ClientSession[]>(),
      supabase
        .from("work_sessions_client_view")
        .select("worker_id, full_name, work_type, start_time, end_time")
        .gte("start_time", todayRange.startIso)
        .lt("start_time", todayRange.endIso)
        .order("start_time", { ascending: false })
        .returns<ClientSession[]>(),
      supabase
        .from("work_sessions_client_view")
        .select("worker_id, full_name, work_type, start_time, end_time")
        .lt("start_time", todayRange.endIso)
        .gt("end_time", todayRange.startIso)
        .order("start_time", { ascending: true })
        .returns<ClientSession[]>(),
      supabase
        .from("pauses_client_view")
        .select("worker_id, full_name, start_time, end_time")
        .lt("start_time", todayRange.endIso)
        .gt("end_time", todayRange.startIso)
        .order("start_time", { ascending: true })
        .returns<ClientPause[]>(),
      supabase
        .from("pauses_client_view")
        .select("worker_id, full_name, start_time, end_time")
        .order("start_time", { ascending: false })
        .returns<ClientPause[]>()
    ]);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  if (todaySessionsError) {
    throw new Error(todaySessionsError.message);
  }

  if (timelineSessionsError) {
    throw new Error(timelineSessionsError.message);
  }

  if (timelinePausesError) {
    throw new Error(timelinePausesError.message);
  }

  if (pausesError) {
    throw new Error(pausesError.message);
  }

  return (
    <ClientDashboard
      fullName={profile.full_name}
      pauses={pauses ?? []}
      sessions={sessions ?? []}
      timelineDayEndIso={todayRange.endIso}
      timelineDayStartIso={todayRange.startIso}
      timelinePauses={timelinePauses ?? []}
      timelineSessions={timelineSessions ?? []}
      todaySessions={todaySessions ?? []}
    />
  );
}

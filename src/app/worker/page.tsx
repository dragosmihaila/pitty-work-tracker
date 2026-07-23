import { requireRole } from "@/lib/auth";
import { APP_TIME_ZONE } from "@/lib/config";
import { getTodayRangeForTimeZone } from "@/lib/time-zone";
import { WorkerDashboard, type PauseRow } from "@/app/worker/worker-dashboard";
import type { WorkerSession } from "@/lib/worker-summary";

export const dynamic = "force-dynamic";

export default async function WorkerPage() {
  const { supabase, user, profile } = await requireRole("worker");
  const now = new Date().toISOString();
  const todayRange = getTodayRangeForTimeZone(APP_TIME_ZONE);

  const [
    { data: sessions, error: sessionsError },
    { data: timelineSessions, error: timelineSessionsError },
    { data: timelinePauses, error: timelinePausesError },
    { data: activePause, error: pauseError }
  ] =
    await Promise.all([
      supabase
        .from("work_sessions")
        .select("id, worker_id, work_type, start_time, end_time, amount_eur")
        .eq("worker_id", user.id)
        .order("start_time", { ascending: false })
        .returns<WorkerSession[]>(),
      supabase
        .from("work_sessions")
        .select("id, worker_id, work_type, start_time, end_time, amount_eur")
        .eq("worker_id", user.id)
        .lt("start_time", todayRange.endIso)
        .gt("end_time", todayRange.startIso)
        .order("start_time", { ascending: true })
        .returns<WorkerSession[]>(),
      supabase
        .from("pauses")
        .select("id, worker_id, start_time, end_time")
        .eq("worker_id", user.id)
        .lt("start_time", todayRange.endIso)
        .gt("end_time", todayRange.startIso)
        .order("start_time", { ascending: true })
        .returns<PauseRow[]>(),
      supabase
        .from("pauses")
        .select("id, worker_id, start_time, end_time")
        .eq("worker_id", user.id)
        .lte("start_time", now)
        .gt("end_time", now)
        .order("end_time", { ascending: false })
        .limit(1)
        .maybeSingle<PauseRow>()
    ]);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  if (timelineSessionsError) {
    throw new Error(timelineSessionsError.message);
  }

  if (timelinePausesError) {
    throw new Error(timelinePausesError.message);
  }

  if (pauseError) {
    throw new Error(pauseError.message);
  }

  return (
    <WorkerDashboard
      activePause={activePause ?? null}
      fullName={profile.full_name}
      sessions={sessions ?? []}
      timelineDayEndIso={todayRange.endIso}
      timelineDayStartIso={todayRange.startIso}
      timelinePauses={timelinePauses ?? []}
      timelineSessions={timelineSessions ?? []}
    />
  );
}

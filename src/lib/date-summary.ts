export type WorkType = "manual" | "excavator";

export type SessionForHours = {
  work_type: WorkType;
  start_time: string;
  end_time: string;
};

export type HoursBucket = {
  label: string;
  manual: number;
  excavator: number;
  total: number;
};

export function durationHours(startTime: string, endTime: string) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return Math.max(0, (end - start) / 3_600_000);
}

export function formatHours(hours: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(hours);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function buildHoursSummary(sessions: SessionForHours[], mode: "day" | "week") {
  const buckets = new Map<string, HoursBucket>();

  for (const session of sessions) {
    const key = mode === "day" ? dayKey(session.start_time) : weekKey(session.start_time);
    const current = buckets.get(key) ?? {
      label: key,
      manual: 0,
      excavator: 0,
      total: 0
    };
    const hours = durationHours(session.start_time, session.end_time);

    current[session.work_type] += hours;
    current.total += hours;
    buckets.set(key, current);
  }

  return Array.from(buckets.values()).sort((a, b) => b.label.localeCompare(a.label));
}

export function grandHoursTotal(sessions: SessionForHours[]) {
  return sessions.reduce(
    (total, session) => {
      const hours = durationHours(session.start_time, session.end_time);
      total[session.work_type] += hours;
      total.combined += hours;
      return total;
    },
    { manual: 0, excavator: 0, combined: 0 }
  );
}

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function weekKey(value: string) {
  const date = new Date(value);
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay() || 7;
  local.setDate(local.getDate() - day + 1);
  return `${local.getFullYear()}-W${pad(getWeekNumber(local))}`;
}

function getWeekNumber(date: Date) {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604_800_000);
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}


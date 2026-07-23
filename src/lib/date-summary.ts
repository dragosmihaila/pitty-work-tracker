export type WorkType = "manual" | "excavator";

export type SessionForHours = {
  work_type: WorkType;
  start_time: string;
  end_time: string;
};

export type HoursBucket = {
  label: string;
  sortKey: string;
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

export function formatDurationMinutes(startTime: string, endTime: string) {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const totalMinutes = Math.max(0, Math.round((endMs - startMs) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${totalMinutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function buildHoursSummary(sessions: SessionForHours[], mode: "day" | "week", locale?: string) {
  const buckets = new Map<string, HoursBucket>();

  for (const session of sessions) {
    const key = mode === "day" ? dayKey(session.start_time) : weekKey(session.start_time);
    const current = buckets.get(key) ?? {
      label: key,
      sortKey: key,
      manual: 0,
      excavator: 0,
      total: 0
    };
    const hours = durationHours(session.start_time, session.end_time);

    current[session.work_type] += hours;
    current.total += hours;
    buckets.set(key, current);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      label: mode === "week" ? formatWeekRange(bucket.sortKey, locale) : bucket.label
    }))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
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
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

function formatWeekRange(mondayKey: string, locale?: string) {
  const [year, month, day] = mondayKey.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric"
  }).format(monday);
  const endLabel = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(sunday);

  return `${startLabel} - ${endLabel}`;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

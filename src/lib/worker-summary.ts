import { durationHours, type WorkType } from "@/lib/date-summary";

export type WorkerSession = {
  id: string;
  worker_id: string;
  work_type: WorkType;
  start_time: string;
  end_time: string;
  amount_eur: number;
};

export type WorkerMoneyBucket = {
  label: string;
  manualHours: number;
  excavatorHours: number;
  totalHours: number;
  manualAmount: number;
  excavatorAmount: number;
  totalAmount: number;
};

export function buildWorkerSummary(sessions: WorkerSession[], mode: "day" | "week") {
  const buckets = new Map<string, WorkerMoneyBucket>();

  for (const session of sessions) {
    const key = mode === "day" ? dayKey(session.start_time) : weekKey(session.start_time);
    const current = buckets.get(key) ?? {
      label: key,
      manualHours: 0,
      excavatorHours: 0,
      totalHours: 0,
      manualAmount: 0,
      excavatorAmount: 0,
      totalAmount: 0
    };
    const hours = durationHours(session.start_time, session.end_time);
    const amount = Number(session.amount_eur);

    if (session.work_type === "manual") {
      current.manualHours += hours;
      current.manualAmount += amount;
    } else {
      current.excavatorHours += hours;
      current.excavatorAmount += amount;
    }

    current.totalHours += hours;
    current.totalAmount += amount;
    buckets.set(key, current);
  }

  return Array.from(buckets.values()).sort((a, b) => b.label.localeCompare(a.label));
}

export function grandWorkerTotal(sessions: WorkerSession[]) {
  return sessions.reduce(
    (total, session) => {
      const hours = durationHours(session.start_time, session.end_time);
      const amount = Number(session.amount_eur);

      if (session.work_type === "manual") {
        total.manualHours += hours;
        total.manualAmount += amount;
      } else {
        total.excavatorHours += hours;
        total.excavatorAmount += amount;
      }

      total.totalHours += hours;
      total.totalAmount += amount;
      return total;
    },
    {
      manualHours: 0,
      excavatorHours: 0,
      totalHours: 0,
      manualAmount: 0,
      excavatorAmount: 0,
      totalAmount: 0
    }
  );
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR"
  }).format(value);
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


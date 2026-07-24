import { durationHours, formatWeekRange, getSummaryPeriodKey, type WorkType } from "@/lib/date-summary";

export type WorkerSession = {
  id: string;
  worker_id: string;
  work_type: WorkType;
  start_time: string;
  end_time: string;
  /** Stored in the database as amount_eur for compatibility; interpreted as an hourly rate. */
  amount_eur: number;
};

export type WorkerMoneyBucket = {
  label: string;
  sortKey: string;
  manualHours: number;
  excavatorHours: number;
  totalHours: number;
  manualAmount: number;
  excavatorAmount: number;
  totalAmount: number;
};

export function buildWorkerSummary(sessions: WorkerSession[], mode: "day" | "week", locale?: string) {
  const buckets = new Map<string, WorkerMoneyBucket>();

  for (const session of sessions) {
    const key = getSummaryPeriodKey(session.start_time, mode);
    const current = buckets.get(key) ?? {
      label: key,
      sortKey: key,
      manualHours: 0,
      excavatorHours: 0,
      totalHours: 0,
      manualAmount: 0,
      excavatorAmount: 0,
      totalAmount: 0
    };
    const hours = durationHours(session.start_time, session.end_time);
    const earnings = Number(session.amount_eur) * hours;

    if (session.work_type === "manual") {
      current.manualHours += hours;
      current.manualAmount += earnings;
    } else {
      current.excavatorHours += hours;
      current.excavatorAmount += earnings;
    }

    current.totalHours += hours;
    current.totalAmount += earnings;
    buckets.set(key, current);
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      ...bucket,
      label: mode === "week" ? formatWeekRange(bucket.sortKey, locale) : bucket.label
    }))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

export function grandWorkerTotal(sessions: WorkerSession[]) {
  return sessions.reduce(
    (total, session) => {
      const hours = durationHours(session.start_time, session.end_time);
      const earnings = Number(session.amount_eur) * hours;

      if (session.work_type === "manual") {
        total.manualHours += hours;
        total.manualAmount += earnings;
      } else {
        total.excavatorHours += hours;
        total.excavatorAmount += earnings;
      }

      total.totalHours += hours;
      total.totalAmount += earnings;
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

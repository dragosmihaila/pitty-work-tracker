"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "@/app/actions";
import { logWorkSession, startPause, updatePauseEnd } from "@/app/worker/actions";
import { durationHours, formatDateTime, formatHours } from "@/lib/date-summary";
import {
  buildWorkerSummary,
  formatMoney,
  grandWorkerTotal,
  type WorkerSession
} from "@/lib/worker-summary";

export type PauseRow = {
  id: string;
  worker_id: string;
  start_time: string;
  end_time: string;
};

type WorkerDashboardProps = {
  fullName: string;
  sessions: WorkerSession[];
  activePause: PauseRow | null;
};

export function WorkerDashboard({ fullName, sessions, activePause }: WorkerDashboardProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(activePause?.end_time));
  const [showPauseForm, setShowPauseForm] = useState(false);
  const paused = Boolean(activePause && remaining.totalMs > 0);
  const daySummary = useMemo(() => buildWorkerSummary(sessions, "day"), [sessions]);
  const weekSummary = useMemo(() => buildWorkerSummary(sessions, "week"), [sessions]);
  const grandTotal = useMemo(() => grandWorkerTotal(sessions), [sessions]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(activePause?.end_time));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activePause?.end_time]);

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="label">Worker dashboard</p>
            <h1 className="text-2xl font-semibold text-slate-950">Hi, {fullName}</h1>
          </div>
          <form action={signOut}>
            <button className="btn-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label">Pause status</p>
                {paused ? (
                  <p className="mt-1 text-lg font-semibold text-clay">
                    Paused for {remaining.hours}h {remaining.minutes}m {remaining.seconds}s
                  </p>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-meadow">Ready to log work</p>
                )}
              </div>
              <div>
                <button
                  className="btn-secondary w-full sm:w-auto"
                  disabled={paused}
                  onClick={() => setShowPauseForm((value) => !value)}
                  type="button"
                >
                  Start pause
                </button>
              </div>
            </div>

            {showPauseForm && !paused ? (
              <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" action={startPause}>
                <div className="space-y-2">
                  <label className="label" htmlFor="duration_hours">
                    Duration hours
                  </label>
                  <input
                    className="field"
                    id="duration_hours"
                    min="0.25"
                    name="duration_hours"
                    step="0.25"
                    type="number"
                    required
                  />
                </div>
                <button className="btn-primary self-end" type="submit">
                  Save pause
                </button>
              </form>
            ) : null}

            {activePause ? (
              <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" action={updatePauseEnd}>
                <input name="pause_id" type="hidden" value={activePause.id} />
                <div className="space-y-2">
                  <label className="label" htmlFor="pause_end_time">
                    Pause ends
                  </label>
                  <input
                    className="field"
                    id="pause_end_time"
                    name="end_time"
                    type="datetime-local"
                    defaultValue={toDateTimeLocal(activePause.end_time)}
                    required
                  />
                </div>
                <button className="btn-primary self-end" type="submit">
                  Update
                </button>
              </form>
            ) : null}
          </div>

          <form className="rounded-md border border-slate-200 bg-white p-4 shadow-sm" action={logWorkSession}>
            <div className="mb-4">
              <p className="label">New session</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Log work</h2>
            </div>
            <fieldset className="space-y-4" disabled={paused}>
              <div className="space-y-2">
                <label className="label" htmlFor="work_type">
                  Work type
                </label>
                <select className="field" id="work_type" name="work_type" defaultValue="manual" required>
                  <option value="manual">Manual</option>
                  <option value="excavator">Excavator</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="label" htmlFor="start_time">
                    Start
                  </label>
                  <input className="field" id="start_time" name="start_time" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <label className="label" htmlFor="end_time">
                    End
                  </label>
                  <input className="field" id="end_time" name="end_time" type="datetime-local" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label" htmlFor="amount_eur">
                  Rate (EUR/hour)
                </label>
                <input
                  className="field"
                  id="amount_eur"
                  min="0"
                  name="amount_eur"
                  step="0.01"
                  type="number"
                  required
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                Save session
              </button>
            </fieldset>
            {paused ? (
              <p className="mt-3 text-sm text-clay">Work logging is disabled while the pause is active.</p>
            ) : null}
          </form>
        </section>

        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Manual hours" value={formatHours(grandTotal.manualHours)} />
            <Metric label="Excavator hours" value={formatHours(grandTotal.excavatorHours)} />
            <Metric label="Grand total" value={`${formatHours(grandTotal.totalHours)}h / ${formatMoney(grandTotal.totalAmount)}`} />
          </div>

          <SummaryTable title="By day" buckets={daySummary} />
          <SummaryTable title="By week" buckets={weekSummary} />

          <div className="rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <p className="label">Recent sessions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const hours = durationHours(session.start_time, session.end_time);
                    const rate = Number(session.amount_eur);

                    return (
                      <tr className="border-t border-slate-100" key={session.id}>
                        <td className="px-4 py-3 capitalize">{session.work_type}</td>
                        <td className="px-4 py-3">{formatDateTime(session.start_time)}</td>
                        <td className="px-4 py-3">{formatDateTime(session.end_time)}</td>
                        <td className="px-4 py-3">{formatHours(hours)}</td>
                        <td className="px-4 py-3">{formatMoney(rate)}</td>
                        <td className="px-4 py-3">{formatMoney(rate * hours)}</td>
                      </tr>
                    );
                  })}
                  {sessions.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                        No sessions yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="label">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryTable({
  title,
  buckets
}: {
  title: string;
  buckets: ReturnType<typeof buildWorkerSummary>;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Manual</th>
              <th className="px-4 py-3">Excavator</th>
              <th className="px-4 py-3">Total hours</th>
              <th className="px-4 py-3">Total earnings</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr className="border-t border-slate-100" key={bucket.label}>
                <td className="px-4 py-3 font-medium">{bucket.label}</td>
                <td className="px-4 py-3">
                  {formatHours(bucket.manualHours)}h / {formatMoney(bucket.manualAmount)}
                </td>
                <td className="px-4 py-3">
                  {formatHours(bucket.excavatorHours)}h / {formatMoney(bucket.excavatorAmount)}
                </td>
                <td className="px-4 py-3">{formatHours(bucket.totalHours)}h</td>
                <td className="px-4 py-3">{formatMoney(bucket.totalAmount)}</td>
              </tr>
            ))}
            {buckets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  No summary yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getRemaining(endTime?: string) {
  if (!endTime) {
    return { totalMs: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalMs = Math.max(0, new Date(endTime).getTime() - Date.now());
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);

  return { totalMs, hours, minutes, seconds };
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

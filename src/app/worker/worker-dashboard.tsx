"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "@/app/actions";
import { logWorkSession, startPause, stopPause, updatePauseEnd } from "@/app/worker/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TimelineChart } from "@/components/timeline-chart";
import {
  durationHours,
  formatCompactDateTime,
  formatDurationMinutes,
  formatHours
} from "@/lib/date-summary";
import { useLanguage } from "@/lib/i18n";
import { usePlatformStyle } from "@/lib/use-platform-style";
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
  pauses: PauseRow[];
  sessions: WorkerSession[];
  activePause: PauseRow | null;
  timelineDayEndIso: string;
  timelineDayStartIso: string;
  timelinePauses: PauseRow[];
  timelineSessions: WorkerSession[];
};

export function WorkerDashboard({
  fullName,
  pauses,
  sessions,
  activePause,
  timelineDayEndIso,
  timelineDayStartIso,
  timelinePauses,
  timelineSessions
}: WorkerDashboardProps) {
  const [remaining, setRemaining] = useState(() => getRemaining(activePause?.end_time));
  const [showPauseForm, setShowPauseForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const paused = Boolean(activePause && remaining.totalMs > 0);
  const weekSummary = useMemo(() => buildWorkerSummary(sessions, "week"), [sessions]);
  const grandTotal = useMemo(() => grandWorkerTotal(sessions), [sessions]);
  const { language, setLanguage, t } = useLanguage();
  const platformStyle = usePlatformStyle();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemaining(activePause?.end_time));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activePause?.end_time]);

  function updateSubmissionContext(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const dateInput = form.elements.namedItem("session_date");
    const offsetInput = form.elements.namedItem("timezone_offset_minutes");
    const now = new Date();

    if (dateInput instanceof HTMLInputElement) {
      dateInput.value = toLocalDateInputValue(now);
    }

    if (offsetInput instanceof HTMLInputElement) {
      offsetInput.value = String(now.getTimezoneOffset());
    }
  }

  return (
    <main className={`worker-dashboard min-h-screen bg-paper os-${platformStyle}`}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="label">{t("workerDashboard")}</p>
            <h1 className="text-2xl font-semibold text-slate-950">{t("hi", { name: fullName })}</h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher label={t("language")} language={language} onChange={setLanguage} />
            <form action={signOut}>
              <button className="btn-secondary" type="submit">
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="space-y-5">
          <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="label">{t("pauseStatus")}</p>
                {paused ? (
                  <p className="mt-1 text-lg font-semibold text-clay">
                    {t("pausedFor", remaining)}
                  </p>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-meadow">{t("readyToLogWork")}</p>
                )}
              </div>
              {paused && activePause ? (
                <form action={stopPause}>
                  <input name="pause_id" type="hidden" value={activePause.id} />
                  <button className="btn-primary w-full bg-clay hover:bg-clay/90 sm:w-auto" type="submit">
                    {t("stopPause")}
                  </button>
                </form>
              ) : (
                <div>
                  <button
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => setShowPauseForm((value) => !value)}
                    type="button"
                  >
                    {t("startPause")}
                  </button>
                </div>
              )}
            </div>

            {showPauseForm && !paused ? (
              <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" action={startPause}>
                <div className="space-y-2">
                  <label className="label" htmlFor="duration_hours">
                    {t("durationHours")}
                  </label>
                  <input
                    className="field"
                    id="duration_hours"
                    min="0.25"
                    name="duration_hours"
                    placeholder={t("durationPlaceholder")}
                    step="0.25"
                    type="number"
                    required
                  />
                </div>
                <button className="btn-primary self-end" type="submit">
                  {t("savePause")}
                </button>
              </form>
            ) : null}

            {activePause ? (
              <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" action={updatePauseEnd}>
                <input name="pause_id" type="hidden" value={activePause.id} />
                <div className="space-y-2">
                  <label className="label" htmlFor="pause_end_time">
                    {t("pauseEnds")}
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
                  {t("update")}
                </button>
              </form>
            ) : null}
          </div>

          <form
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            action={logWorkSession}
            onSubmit={updateSubmissionContext}
          >
            <input name="session_date" type="hidden" defaultValue={toLocalDateInputValue(new Date())} />
            <input name="timezone_offset_minutes" type="hidden" defaultValue={String(new Date().getTimezoneOffset())} />
            <div className="mb-4">
              <p className="label">{t("newSession")}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{t("logWork")}</h2>
            </div>
            <fieldset className="space-y-4" disabled={paused}>
              <div className="space-y-2">
                <label className="label" htmlFor="work_type">
                  {t("workType")}
                </label>
                <select className="field" id="work_type" name="work_type" defaultValue="manual" required>
                  <option value="manual">{t("manual")}</option>
                  <option value="excavator">{t("excavator")}</option>
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TimeField
                  doneLabel={t("done")}
                  id="start_time"
                  label={t("start")}
                  name="start_time"
                  placeholder={t("selectStartTime")}
                  value={startTime}
                  onChange={setStartTime}
                />
                <TimeField
                  doneLabel={t("done")}
                  id="end_time"
                  label={t("end")}
                  name="end_time"
                  placeholder={t("selectEndTime")}
                  value={endTime}
                  onChange={setEndTime}
                />
              </div>
              <div className="space-y-2">
                <label className="label" htmlFor="amount_eur">
                  {t("rate")}
                </label>
                <input
                  className="field"
                  id="amount_eur"
                  min="0"
                  name="amount_eur"
                  placeholder={t("ratePlaceholder")}
                  step="0.01"
                  type="number"
                  required
                />
              </div>
              <button className="btn-primary w-full" type="submit">
                {t("saveSession")}
              </button>
            </fieldset>
            {paused ? <p className="mt-3 text-sm text-clay">{t("disabledWhilePaused")}</p> : null}
          </form>
          </section>

          <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label={t("manualHours")} value={formatHours(grandTotal.manualHours)} />
            <Metric label={t("excavatorHours")} value={formatHours(grandTotal.excavatorHours)} />
            <Metric label={t("grandTotal")} value={`${formatHours(grandTotal.totalHours)} / ${formatMoney(grandTotal.totalAmount)}`} />
          </div>

          <TimelineChart
            dayEndIso={timelineDayEndIso}
            dayStartIso={timelineDayStartIso}
            labels={{
              excavator: t("excavatorTimeline"),
              idle: t("idle"),
              manual: t("manualTimeline"),
              pause: t("pauseTimeline"),
              title: t("todayTimeline")
            }}
            pauses={timelinePauses}
            sessions={timelineSessions}
          />

          <SummaryTable title={t("byWeek")} buckets={weekSummary} t={t} />
          </section>
        </div>

        <section className="mt-5 space-y-3">
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              showHistory ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-5 lg:grid-cols-2">
                <RecentSessionsTable sessions={sessions} t={t} />
                <PausesTable pauses={pauses} t={t} />
              </div>
            </div>
          </div>
          <div className="history-toggle-wrap">
            <button
              aria-expanded={showHistory}
              className="history-toggle btn-secondary w-full"
              onClick={() => setShowHistory((value) => !value)}
              type="button"
            >
              {showHistory ? t("hideHistory") : t("history")}
            </button>
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
  buckets,
  t
}: {
  title: string;
  buckets: ReturnType<typeof buildWorkerSummary>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{title}</p>
      </div>
      <div>
        <table className="compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[21%]" />
            <col className="w-[21%]" />
            <col className="w-[15%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("period")}</th>
              <th className="px-4 py-3 text-right">{t("manual")}</th>
              <th className="px-4 py-3 text-right">{t("excavator")}</th>
              <th className="px-4 py-3 text-right">{t("totalHours")}</th>
              <th className="px-4 py-3 text-right">{t("totalEarnings")}</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr className="border-t border-slate-100" key={bucket.label}>
                <td className="px-4 py-3 font-medium tabular-nums">{bucket.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatHours(bucket.manualHours)} / {formatMoney(bucket.manualAmount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatHours(bucket.excavatorHours)} / {formatMoney(bucket.excavatorAmount)}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatHours(bucket.totalHours)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatMoney(bucket.totalAmount)}</td>
              </tr>
            ))}
            {buckets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  {t("noSummary")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentSessionsTable({
  sessions,
  t
}: {
  sessions: WorkerSession[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{t("recentSessions")}</p>
      </div>
      <div>
        <table className="compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[15%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("type")}</th>
              <th className="px-4 py-3">{t("start")}</th>
              <th className="px-4 py-3">{t("end")}</th>
              <th className="px-4 py-3 text-right">{t("hours")}</th>
              <th className="px-4 py-3 text-right">{t("rateShort")}</th>
              <th className="px-4 py-3 text-right">{t("earnings")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const hours = durationHours(session.start_time, session.end_time);
              const rate = Number(session.amount_eur);

              return (
                <tr className="border-t border-slate-100" key={session.id}>
                  <td className="px-4 py-3 font-medium">{t(session.work_type)}</td>
                  <td className="px-4 py-3">
                    <CompactDateTime value={session.start_time} />
                  </td>
                  <td className="px-4 py-3">
                    <CompactDateTime value={session.end_time} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{formatHours(hours)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(rate)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(rate * hours)}</td>
                </tr>
              );
            })}
            {sessions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  {t("noSessions")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PausesTable({
  pauses,
  t
}: {
  pauses: PauseRow[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{t("pauses")}</p>
      </div>
      <div>
        <table className="compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[34%]" />
            <col className="w-[32%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("start")}</th>
              <th className="px-4 py-3">{t("end")}</th>
              <th className="px-4 py-3 text-right">{t("duration")}</th>
            </tr>
          </thead>
          <tbody>
            {pauses.map((pause) => (
              <tr className="border-t border-slate-100" key={pause.id}>
                <td className="px-4 py-3">
                  <CompactDateTime value={pause.start_time} />
                </td>
                <td className="px-4 py-3">
                  <CompactDateTime value={pause.end_time} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatDurationMinutes(pause.start_time, pause.end_time)}
                </td>
              </tr>
            ))}
            {pauses.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                  {t("noPauses")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompactDateTime({ value }: { value: string }) {
  const { day, time } = formatCompactDateTime(value);

  return (
    <span className="compact-date tabular-nums">
      <span>{day}</span>
      <span>{time}</span>
    </span>
  );
}

function TimeField({
  doneLabel,
  id,
  label,
  name,
  placeholder,
  value,
  onChange
}: {
  doneLabel: string;
  id: string;
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative space-y-2" ref={wrapperRef}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={name} readOnly type="hidden" value={value} />
      <button
        className="field flex min-h-11 items-center justify-between text-left"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className={value ? "text-slate-950" : "text-slate-400"}>{value || placeholder}</span>
        <span aria-hidden="true" className="text-slate-400">
          :
        </span>
      </button>
      <div
        aria-hidden={!open}
        className="time-popover absolute left-0 right-0 z-20 mt-2 rounded-md border border-slate-200 bg-white p-3 shadow-sm transition duration-200 ease-out"
        data-open={open}
      >
        <input
          aria-label={label}
          className="field"
          disabled={!open}
          onChange={(event) => onChange(event.target.value)}
          type="time"
          value={value}
        />
        <div className="mt-3 flex justify-end">
          <button className="btn-primary min-h-10 px-4" disabled={!open} onClick={() => setOpen(false)} type="button">
            {doneLabel}
          </button>
        </div>
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

function toLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

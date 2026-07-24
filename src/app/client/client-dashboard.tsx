"use client";

import { useMemo, useState } from "react";
import { signOut } from "@/app/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TimelineChart } from "@/components/timeline-chart";
import {
  buildHoursSummary,
  durationHours,
  formatCompactDateTime,
  formatDurationMinutes,
  formatHours,
  grandHoursTotal,
  type WorkType
} from "@/lib/date-summary";
import { localeForLanguage, useLanguage } from "@/lib/i18n";
import { usePlatformStyle } from "@/lib/use-platform-style";

export type ClientSession = {
  worker_id: string;
  full_name: string;
  work_type: WorkType;
  start_time: string;
  end_time: string;
};

export type ClientPause = {
  worker_id: string;
  full_name: string;
  start_time: string;
  end_time: string;
};

type ClientDashboardProps = {
  fullName: string;
  pauses: ClientPause[];
  sessions: ClientSession[];
  timelineDayEndIso: string;
  timelineDayStartIso: string;
  timelinePauses: ClientPause[];
  timelineSessions: ClientSession[];
  todaySessions: ClientSession[];
};

export function ClientDashboard({
  fullName,
  pauses,
  sessions,
  timelineDayEndIso,
  timelineDayStartIso,
  timelinePauses,
  timelineSessions,
  todaySessions
}: ClientDashboardProps) {
  const { language, setLanguage, t } = useLanguage();
  const locale = localeForLanguage(language);
  const weekSummary = useMemo(() => buildHoursSummary(sessions, "week", locale), [locale, sessions]);
  const todayTotal = useMemo(() => grandHoursTotal(todaySessions), [todaySessions]);
  const platformStyle = usePlatformStyle();
  const [showHistory, setShowHistory] = useState(false);

  return (
    <main className={`client-dashboard min-h-screen bg-paper os-${platformStyle}`}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="label">{t("clientDashboard")}</p>
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

      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-5">
        <section className="client-panel rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="label">{t("today")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MetricBlock label={t("manualHours")} value={formatHours(todayTotal.manual)} />
            <MetricBlock label={t("excavatorHours")} value={formatHours(todayTotal.excavator)} />
            <MetricBlock label={t("combinedHours")} value={formatHours(todayTotal.combined)} />
          </div>
        </section>

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

        <section>
          <SummaryTable title={t("hoursByWeek")} buckets={weekSummary} t={t} />
        </section>

        <section className="space-y-3">
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              showHistory ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-5 lg:grid-cols-2">
                <WorkSessionsTable sessions={sessions} t={t} />
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

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="client-metric rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryTable({
  title,
  buckets,
  t
}: {
  title: string;
  buckets: ReturnType<typeof buildHoursSummary>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="client-panel rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{title}</p>
      </div>
      <div>
        <table className="client-table compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("period")}</th>
              <th className="px-4 py-3 text-right">{t("manual")}</th>
              <th className="px-4 py-3 text-right">{t("excavator")}</th>
              <th className="px-4 py-3 text-right">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr className="border-t border-slate-100" key={bucket.label}>
                <td className="px-4 py-3 font-medium">{bucket.label}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatHours(bucket.manual)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatHours(bucket.excavator)}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{formatHours(bucket.total)}</td>
              </tr>
            ))}
            {buckets.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
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

function WorkSessionsTable({
  sessions,
  t
}: {
  sessions: ClientSession[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="client-panel rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{t("workSessions")}</p>
      </div>
      <div>
        <table className="client-table compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("worker")}</th>
              <th className="px-4 py-3">{t("type")}</th>
              <th className="px-4 py-3">{t("start")}</th>
              <th className="px-4 py-3">{t("end")}</th>
              <th className="px-4 py-3 text-right">{t("hours")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr
                className="border-t border-slate-100"
                key={`${session.worker_id}-${session.start_time}-${session.end_time}`}
              >
                <td className="px-4 py-3 font-medium">{session.full_name}</td>
                <td className="px-4 py-3">{t(session.work_type)}</td>
                <td className="px-4 py-3">
                  <CompactDateTime value={session.start_time} />
                </td>
                <td className="px-4 py-3">
                  <CompactDateTime value={session.end_time} />
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {formatHours(durationHours(session.start_time, session.end_time))}
                </td>
              </tr>
            ))}
            {sessions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                  {t("noWorkSessions")}
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
  pauses: ClientPause[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="client-panel rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{t("pauses")}</p>
      </div>
      <div>
        <table className="client-table compact-table w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[26%]" />
            <col className="w-[26%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("worker")}</th>
              <th className="px-4 py-3">{t("start")}</th>
              <th className="px-4 py-3">{t("end")}</th>
              <th className="px-4 py-3 text-right">{t("duration")}</th>
            </tr>
          </thead>
          <tbody>
            {pauses.map((pause) => (
              <tr className="border-t border-slate-100" key={`${pause.worker_id}-${pause.start_time}`}>
                <td className="px-4 py-3 font-medium">{pause.full_name}</td>
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
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
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

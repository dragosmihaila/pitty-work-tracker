"use client";

import { useMemo } from "react";
import { signOut } from "@/app/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  buildHoursSummary,
  durationHours,
  formatDateTime,
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
  todaySessions: ClientSession[];
};

export function ClientDashboard({ fullName, pauses, sessions, todaySessions }: ClientDashboardProps) {
  const { language, setLanguage, t } = useLanguage();
  const locale = localeForLanguage(language);
  const daySummary = useMemo(() => buildHoursSummary(sessions, "day", locale), [locale, sessions]);
  const weekSummary = useMemo(() => buildHoursSummary(sessions, "week", locale), [locale, sessions]);
  const todayTotal = useMemo(() => grandHoursTotal(todaySessions), [todaySessions]);
  const platformStyle = usePlatformStyle();

  return (
    <main className={`min-h-screen bg-paper os-${platformStyle}`}>
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
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="label">{t("today")}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <MetricBlock label={t("manualHours")} value={formatHours(todayTotal.manual)} />
            <MetricBlock label={t("excavatorHours")} value={formatHours(todayTotal.excavator)} />
            <MetricBlock label={t("combinedHours")} value={formatHours(todayTotal.combined)} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <SummaryTable title={t("hoursByDay")} buckets={daySummary} t={t} />
          <SummaryTable title={t("hoursByWeek")} buckets={weekSummary} t={t} />
        </section>

        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <p className="label">{t("workSessions")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("worker")}</th>
                  <th className="px-4 py-3">{t("type")}</th>
                  <th className="px-4 py-3">{t("start")}</th>
                  <th className="px-4 py-3">{t("end")}</th>
                  <th className="px-4 py-3">{t("hours")}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    className="border-t border-slate-100"
                    key={`${session.worker_id}-${session.start_time}-${session.end_time}`}
                  >
                    <td className="px-4 py-3">{session.full_name}</td>
                    <td className="px-4 py-3">{t(session.work_type)}</td>
                    <td className="px-4 py-3">{formatDateTime(session.start_time)}</td>
                    <td className="px-4 py-3">{formatDateTime(session.end_time)}</td>
                    <td className="px-4 py-3">{formatHours(durationHours(session.start_time, session.end_time))}</td>
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
        </section>

        <section className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <p className="label">{t("pauses")}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("worker")}</th>
                  <th className="px-4 py-3">{t("start")}</th>
                  <th className="px-4 py-3">{t("end")}</th>
                  <th className="px-4 py-3">{t("duration")}</th>
                </tr>
              </thead>
              <tbody>
                {pauses.map((pause) => (
                  <tr className="border-t border-slate-100" key={`${pause.worker_id}-${pause.start_time}`}>
                    <td className="px-4 py-3">{pause.full_name}</td>
                    <td className="px-4 py-3">{formatDateTime(pause.start_time)}</td>
                    <td className="px-4 py-3">{formatDateTime(pause.end_time)}</td>
                    <td className="px-4 py-3">{formatDurationMinutes(pause.start_time, pause.end_time)}</td>
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
        </section>
      </div>
    </main>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
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
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <p className="label">{title}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("period")}</th>
              <th className="px-4 py-3">{t("manual")}</th>
              <th className="px-4 py-3">{t("excavator")}</th>
              <th className="px-4 py-3">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) => (
              <tr className="border-t border-slate-100" key={bucket.label}>
                <td className="px-4 py-3 font-medium">{bucket.label}</td>
                <td className="px-4 py-3">{formatHours(bucket.manual)}</td>
                <td className="px-4 py-3">{formatHours(bucket.excavator)}</td>
                <td className="px-4 py-3">{formatHours(bucket.total)}</td>
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

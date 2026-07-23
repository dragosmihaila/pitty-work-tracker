"use client";

import type { WorkType } from "@/lib/date-summary";

type TimelineSession = {
  work_type: WorkType;
  start_time: string;
  end_time: string;
};

type TimelinePause = {
  start_time: string;
  end_time: string;
};

type TimelineChartProps = {
  dayEndIso: string;
  dayStartIso: string;
  labels: {
    excavator: string;
    idle: string;
    manual: string;
    pause: string;
    title: string;
  };
  pauses: TimelinePause[];
  sessions: TimelineSession[];
};

type TimelineSegment = {
  color: string;
  durationMinutes: number;
  endMs: number;
  interactive: boolean;
  kind: WorkType | "pause" | "idle";
  left: number;
  startMs: number;
  width: number;
};

const COLORS = {
  excavator: "#BA7517",
  idle: "#888780",
  manual: "#639922",
  pause: "#185FA5"
} as const;

const HOUR_MARKERS = ["00:00", "06:00", "12:00", "18:00", "24:00"];

export function TimelineChart({ dayEndIso, dayStartIso, labels, pauses, sessions }: TimelineChartProps) {
  const segments = buildTimelineSegments({
    dayEndIso,
    dayStartIso,
    pauses,
    sessions
  });

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="label">{labels.title}</p>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <Legend color={COLORS.manual} label={labels.manual} />
          <Legend color={COLORS.excavator} label={labels.excavator} />
          <Legend color={COLORS.pause} label={labels.pause} />
          <Legend color={COLORS.idle} label={labels.idle} />
        </div>
      </div>

      <div className="mt-10">
        <div className="relative h-6 rounded-md bg-[#888780]">
          {segments.map((segment, index) => (
            <TimelineSegmentView
              key={`${segment.kind}-${segment.startMs}-${segment.endMs}-${index}`}
              labels={labels}
              segment={segment}
            />
          ))}
        </div>
        <div className="relative mt-3 h-5 text-[11px] font-medium text-slate-500">
          {HOUR_MARKERS.map((marker, index) => (
            <span
              className="absolute top-0 -translate-x-1/2"
              key={marker}
              style={{ left: `${index * 25}%` }}
            >
              {marker}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function buildTimelineSegments({
  dayEndIso,
  dayStartIso,
  pauses,
  sessions
}: {
  dayEndIso: string;
  dayStartIso: string;
  pauses: TimelinePause[];
  sessions: TimelineSession[];
}) {
  const dayStartMs = new Date(dayStartIso).getTime();
  const dayEndMs = new Date(dayEndIso).getTime();
  const dayDurationMs = dayEndMs - dayStartMs;
  const events = [
    ...sessions.map((session) => ({
      endMs: new Date(session.end_time).getTime(),
      kind: session.work_type,
      startMs: new Date(session.start_time).getTime()
    })),
    ...pauses.map((pause) => ({
      endMs: new Date(pause.end_time).getTime(),
      kind: "pause" as const,
      startMs: new Date(pause.start_time).getTime()
    }))
  ]
    .map((event) => ({
      ...event,
      endMs: Math.min(dayEndMs, event.endMs),
      startMs: Math.max(dayStartMs, event.startMs)
    }))
    .filter((event) => event.endMs > event.startMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);

  const segments: TimelineSegment[] = [];
  let cursorMs = dayStartMs;

  for (const event of events) {
    if (event.startMs > cursorMs) {
      segments.push(createSegment("idle", cursorMs, event.startMs, dayStartMs, dayDurationMs));
    }

    const startMs = Math.max(event.startMs, cursorMs);
    if (event.endMs > startMs) {
      segments.push(createSegment(event.kind, startMs, event.endMs, dayStartMs, dayDurationMs));
      cursorMs = event.endMs;
    }
  }

  if (cursorMs < dayEndMs) {
    segments.push(createSegment("idle", cursorMs, dayEndMs, dayStartMs, dayDurationMs));
  }

  return segments;
}

function TimelineSegmentView({
  labels,
  segment
}: {
  labels: TimelineChartProps["labels"];
  segment: TimelineSegment;
}) {
  const label = labels[segment.kind];
  const durationLabel = `${formatTimelineDuration(segment.durationMinutes)} ${label.toLowerCase()}`;

  return (
    <div
      className={`absolute top-0 h-6 transition duration-150 ${
        segment.interactive ? "group hover:z-10 hover:-translate-y-1 hover:brightness-110" : ""
      }`}
      style={{
        backgroundColor: segment.color,
        left: `${segment.left}%`,
        width: `${segment.width}%`
      }}
    >
      {segment.interactive ? (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition duration-150 group-hover:opacity-100">
          <TimelineIcon kind={segment.kind} />
          <span>{durationLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

function TimelineIcon({ kind }: { kind: TimelineSegment["kind"] }) {
  if (kind === "manual") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M7 11V5a2 2 0 0 1 4 0v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 10V4a2 2 0 0 1 4 0v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 11V6a2 2 0 0 1 4 0v8c0 4-3 7-7 7H9c-3 0-5-2-5-5v-4a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "excavator") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M3 15h11l3-5h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 15v-4h5l3 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M9 3h6M10 3v4l-2 3v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9l-2-3V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function createSegment(
  kind: TimelineSegment["kind"],
  startMs: number,
  endMs: number,
  dayStartMs: number,
  dayDurationMs: number
): TimelineSegment {
  return {
    color: COLORS[kind],
    durationMinutes: Math.round((endMs - startMs) / 60_000),
    endMs,
    interactive: kind !== "idle",
    kind,
    left: ((startMs - dayStartMs) / dayDurationMs) * 100,
    startMs,
    width: ((endMs - startMs) / dayDurationMs) * 100
  };
}

function formatTimelineDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}


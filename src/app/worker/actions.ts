"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";

export async function logWorkSession(formData: FormData) {
  const { supabase, user } = await requireRole("worker");
  const now = new Date().toISOString();

  const { data: activePause, error: pauseError } = await supabase
    .from("pauses")
    .select("id")
    .eq("worker_id", user.id)
    .lte("start_time", now)
    .gt("end_time", now)
    .maybeSingle();

  if (pauseError) {
    throw new Error(pauseError.message);
  }

  if (activePause) {
    throw new Error("A pause is active. End or adjust the pause before logging work.");
  }

  const workType = String(formData.get("work_type") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const timezoneOffsetMinutes = Number(formData.get("timezone_offset_minutes"));
  const amount = Number(formData.get("amount_eur"));

  if (!["manual", "excavator"].includes(workType)) {
    throw new Error("Choose a valid work type.");
  }

  if (!startTime || !endTime || !sessionDate || Number.isNaN(amount)) {
    throw new Error("Fill in all work session fields.");
  }

  const startTimestamp = buildTimestampFromLocalTime(sessionDate, startTime, timezoneOffsetMinutes);
  let endTimestamp = buildTimestampFromLocalTime(sessionDate, endTime, timezoneOffsetMinutes);

  if (endTimestamp.getTime() < startTimestamp.getTime()) {
    endTimestamp = new Date(endTimestamp.getTime() + 86_400_000);
  }

  if (endTimestamp.getTime() === startTimestamp.getTime()) {
    throw new Error("End time must be after start time.");
  }

  const { error } = await supabase.from("work_sessions").insert({
    worker_id: user.id,
    work_type: workType,
    start_time: startTimestamp.toISOString(),
    end_time: endTimestamp.toISOString(),
    amount_eur: amount
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/worker");
}

function buildTimestampFromLocalTime(dateValue: string, timeValue: string, timezoneOffsetMinutes: number) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue);

  if (!dateMatch || !timeMatch || !Number.isFinite(timezoneOffsetMinutes)) {
    throw new Error("Choose valid start and end times.");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (hour > 23 || minute > 59) {
    throw new Error("Choose valid start and end times.");
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute) + timezoneOffsetMinutes * 60_000);
}

export async function startPause(formData: FormData) {
  const { supabase, user } = await requireRole("worker");
  const durationHours = Number(formData.get("duration_hours"));
  const start = new Date();
  const end = new Date(start.getTime() + durationHours * 3_600_000);

  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    throw new Error("Enter a pause duration greater than zero.");
  }

  const now = start.toISOString();

  const { data: activePause, error: findError } = await supabase
    .from("pauses")
    .select("id")
    .eq("worker_id", user.id)
    .lte("start_time", now)
    .gt("end_time", now)
    .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (!activePause) {
    const { error } = await supabase.from("pauses").insert({
      worker_id: user.id,
      start_time: now,
      end_time: end.toISOString()
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/worker");
}

export async function updatePauseEnd(formData: FormData) {
  const { supabase, user } = await requireRole("worker");
  const pauseId = String(formData.get("pause_id") ?? "");
  const endTime = String(formData.get("end_time") ?? "");

  if (!pauseId || !endTime) {
    throw new Error("Choose a pause end time.");
  }

  const { error } = await supabase
    .from("pauses")
    .update({ end_time: new Date(endTime).toISOString() })
    .eq("id", pauseId)
    .eq("worker_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/worker");
}

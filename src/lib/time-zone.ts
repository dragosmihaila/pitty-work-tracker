export function getTodayRangeForTimeZone(timeZone: string) {
  const nowParts = getDatePartsForTimeZone(new Date(), timeZone);
  const start = zonedDateTimeToUtc(nowParts.year, nowParts.month, nowParts.day, 0, 0, 0, timeZone);
  const nextDay = new Date(start);
  nextDay.setUTCDate(start.getUTCDate() + 1);
  const nextDayParts = getDatePartsForTimeZone(nextDay, timeZone);
  const end = zonedDateTimeToUtc(nextDayParts.year, nextDayParts.month, nextDayParts.day, 0, 0, 0, timeZone);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const guessParts = getDatePartsForTimeZone(utcGuess, timeZone);
  const wantedUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const guessAsUtc = Date.UTC(
    guessParts.year,
    guessParts.month - 1,
    guessParts.day,
    guessParts.hour,
    guessParts.minute,
    guessParts.second
  );

  return new Date(utcGuess.getTime() - (guessAsUtc - wantedUtc));
}

function getDatePartsForTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}


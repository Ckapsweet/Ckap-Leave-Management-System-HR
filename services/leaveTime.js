export const WORK_HOURS_PER_DAY = 8;

export function isUnlimitedSickLeave(name) {
  const normalized = String(name ?? "").trim().toLowerCase();
  return normalized.includes("ลาป่วย") || normalized === "sick" || normalized === "sick leave";
}

const LUNCH_START_MINUTE = 12 * 60;
const LUNCH_END_MINUTE = 13 * 60;

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function timeToMinutes(time) {
  if (!time) return null;
  const [hour, minute] = String(time).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function calculateLeaveHours(startTime, endTime) {
  const startMinute = timeToMinutes(startTime);
  const endMinute = timeToMinutes(endTime);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) return 0;

  const lunchOverlap = Math.max(
    0,
    Math.min(endMinute, LUNCH_END_MINUTE) - Math.max(startMinute, LUNCH_START_MINUTE)
  );
  const workMinutes = Math.max(0, endMinute - startMinute - lunchOverlap);

  return round(workMinutes / 60, 1);
}

export function leaveHoursToDays(hours) {
  const parsed = Number(hours ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return round(parsed / WORK_HOURS_PER_DAY, 6);
}

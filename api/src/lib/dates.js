// All date logic lives here (SPEC D-12, D-13).
// Dates travel as "YYYY-MM-DD" strings. Prisma gives/takes JS Dates at UTC midnight.

const DAY_MS = 24 * 60 * 60 * 1000;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000; // Asia/Bangkok is UTC+7, no daylight saving

/** Today's date in Bangkok as "YYYY-MM-DD". Pass `now` in tests. */
function todayBangkok(now = new Date()) {
  return new Date(now.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** True for a real calendar date in "YYYY-MM-DD" form (rejects "2026-02-30"). */
function isDateStr(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** "YYYY-MM-DD" → Date at UTC midnight (what Prisma expects for @db.Date). */
function fromDateStr(str) {
  if (!isDateStr(str)) throw new Error(`Invalid date string: ${str}`);
  return new Date(str + "T00:00:00Z");
}

/** Date from Prisma → "YYYY-MM-DD". */
function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" + n days → "YYYY-MM-DD" (n may be negative). */
function addDays(str, n) {
  return toDateStr(new Date(fromDateStr(str).getTime() + n * DAY_MS));
}

/** Whole days from `from` to `to` (both "YYYY-MM-DD"). Negative if `to` is earlier. */
function daysBetween(from, to) {
  return Math.round((fromDateStr(to).getTime() - fromDateStr(from).getTime()) / DAY_MS);
}

module.exports = { todayBangkok, isDateStr, fromDateStr, toDateStr, addDays, daysBetween };

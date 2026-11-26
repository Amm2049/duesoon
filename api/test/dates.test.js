const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  todayBangkok, isDateStr, fromDateStr, toDateStr, addDays, daysBetween,
} = require("../src/lib/dates");

test("todayBangkok: 00:30 Bangkok is still the previous day in UTC", () => {
  // 2026-11-26 00:30 in Bangkok = 2026-11-25 17:30 UTC
  assert.equal(todayBangkok(new Date("2026-11-25T17:30:00Z")), "2026-11-26");
});

test("todayBangkok: 06:59 Bangkok (last minute where UTC date differs)", () => {
  assert.equal(todayBangkok(new Date("2026-11-25T23:59:00Z")), "2026-11-26");
});

test("todayBangkok: 23:59 Bangkok stays the same day", () => {
  // 2026-11-26 23:59 Bangkok = 2026-11-26 16:59 UTC
  assert.equal(todayBangkok(new Date("2026-11-26T16:59:00Z")), "2026-11-26");
});

test("todayBangkok: exactly midnight Bangkok rolls over", () => {
  assert.equal(todayBangkok(new Date("2026-11-26T17:00:00Z")), "2026-11-27");
});

test("isDateStr accepts real dates and rejects fake ones", () => {
  assert.equal(isDateStr("2026-11-28"), true);
  assert.equal(isDateStr("2028-02-29"), true); // leap year
  assert.equal(isDateStr("2026-02-29"), false); // not a leap year
  assert.equal(isDateStr("2026-02-30"), false);
  assert.equal(isDateStr("2026-13-01"), false);
  assert.equal(isDateStr("2026-1-5"), false);
  assert.equal(isDateStr("28/11/2026"), false);
  assert.equal(isDateStr(""), false);
  assert.equal(isDateStr(null), false);
  assert.equal(isDateStr(20261128), false);
});

test("fromDateStr / toDateStr round-trip without shifting the day", () => {
  const d = fromDateStr("2026-11-28");
  assert.equal(d.toISOString(), "2026-11-28T00:00:00.000Z");
  assert.equal(toDateStr(d), "2026-11-28");
});

test("fromDateStr throws on invalid input", () => {
  assert.throws(() => fromDateStr("2026-02-30"));
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-11-26", 7), "2026-12-03");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-11-26", 0), "2026-11-26");
});

test("daysBetween: negative, zero, positive", () => {
  assert.equal(daysBetween("2026-11-26", "2026-11-24"), -2);
  assert.equal(daysBetween("2026-11-26", "2026-11-26"), 0);
  assert.equal(daysBetween("2026-11-26", "2026-12-03"), 7);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
});

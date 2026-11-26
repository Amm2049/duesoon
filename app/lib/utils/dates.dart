// Calendar dates as "YYYY-MM-DD" strings, like the API (D-13).
// Only the date picker needs "today" on the app side; lists use `days_left` from the API.

/// Today's date in Bangkok (UTC+7), the same rule as the API's `todayBangkok()` (D-12, D-47).
/// A phone set to another time zone still gets the server's "today".
String todayBangkok([DateTime? now]) {
  final bangkok = (now ?? DateTime.now()).toUtc().add(const Duration(hours: 7));
  return toYmd(DateTime.utc(bangkok.year, bangkok.month, bangkok.day));
}

/// Year/month/day of [d] (local or UTC, time ignored) → "YYYY-MM-DD".
String toYmd(DateTime d) {
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year.toString().padLeft(4, '0')}-${two(d.month)}-${two(d.day)}';
}

/// "YYYY-MM-DD" → UTC midnight of that date (no time zone shift).
DateTime fromYmd(String ymd) {
  final p = ymd.split('-');
  return DateTime.utc(int.parse(p[0]), int.parse(p[1]), int.parse(p[2]));
}

/// "2026-12-31" + 1 → "2027-01-01" (UTC math, so no daylight-saving surprises).
String addDays(String ymd, int days) => toYmd(fromYmd(ymd).add(Duration(days: days)));

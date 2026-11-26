import 'dates.dart';

/// "2026-11-28" → "Sat 28 Nov" without the intl package (D-25).
/// Parsed as a UTC calendar date, so the phone's time zone can't shift the day.
String formatDue(String ymd) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final date = fromYmd(ymd);
  return '${days[date.weekday - 1]} ${date.day} ${months[date.month - 1]}';
}

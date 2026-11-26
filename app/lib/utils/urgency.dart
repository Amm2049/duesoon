import 'package:material_ui/material_ui.dart';

/// Urgency, groups and labels (SPEC §5, D-14, D-31). All based on `days_left`
/// from the API: the app never computes days itself.

enum Urgency { overdue, soon, later, done }

/// overdue < 0 · soon 0–2 · later ≥ 3 · done wins over everything.
Urgency urgencyOf(int daysLeft, bool done) {
  if (done) return Urgency.done;
  if (daysLeft < 0) return Urgency.overdue;
  if (daysLeft <= 2) return Urgency.soon;
  return Urgency.later;
}

/// The only hard-coded colors in the app (§6.1), with light + dark variants
/// so labels stay readable on both backgrounds.
Color urgencyColor(Urgency urgency, ColorScheme colors) {
  final dark = colors.brightness == Brightness.dark;
  return switch (urgency) {
    Urgency.overdue => dark ? Colors.red.shade300 : Colors.red.shade700,
    Urgency.soon => dark ? Colors.orange.shade300 : Colors.orange.shade800,
    Urgency.later => dark ? Colors.green.shade300 : Colors.green.shade700,
    Urgency.done => colors.outline,
  };
}

/// Day groups for the This Week / All lists, in display order.
enum TaskGroup {
  overdue('Overdue', Urgency.overdue),
  today('Today', Urgency.soon),
  tomorrow('Tomorrow', Urgency.soon),
  thisWeek('This week', Urgency.later),
  later('Later', Urgency.later);

  final String label;
  final Urgency headerUrgency; // color of the group header

  const TaskGroup(this.label, this.headerUrgency);
}

/// <0 Overdue · 0 Today · 1 Tomorrow · 2–7 This week · >7 Later
TaskGroup groupOf(int daysLeft) {
  if (daysLeft < 0) return TaskGroup.overdue;
  if (daysLeft == 0) return TaskGroup.today;
  if (daysLeft == 1) return TaskGroup.tomorrow;
  if (daysLeft <= 7) return TaskGroup.thisWeek;
  return TaskGroup.later;
}

/// D-20: everyone who finished, including me.
String doneCountText(int count) => switch (count) {
      0 => 'Nobody has finished this yet',
      1 => '1 classmate finished this',
      _ => '$count classmates finished this',
    };

/// -3 → "3 days overdue" · -1 → "1 day overdue" · 0 → "Due today" · 1 → "Tomorrow" · n → "In n days"
String dueLabel(int daysLeft) {
  if (daysLeft == -1) return '1 day overdue';
  if (daysLeft < 0) return '${-daysLeft} days overdue';
  if (daysLeft == 0) return 'Due today';
  if (daysLeft == 1) return 'Tomorrow';
  return 'In $daysLeft days';
}

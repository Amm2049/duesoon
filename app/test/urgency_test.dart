import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/utils/date_format.dart';
import 'package:duesoon/utils/urgency.dart';

// SPEC §5 / D-14 / D-31 boundaries.
void main() {
  test('urgencyOf boundaries: -1 overdue, 0..2 soon, 3 later', () {
    expect(urgencyOf(-1, false), Urgency.overdue);
    expect(urgencyOf(0, false), Urgency.soon);
    expect(urgencyOf(2, false), Urgency.soon);
    expect(urgencyOf(3, false), Urgency.later);
  });

  test('done wins over any days_left', () {
    expect(urgencyOf(-5, true), Urgency.done);
    expect(urgencyOf(10, true), Urgency.done);
  });

  test('groupOf boundaries: -1, 0, 1, 2, 7, 8', () {
    expect(groupOf(-1), TaskGroup.overdue);
    expect(groupOf(0), TaskGroup.today);
    expect(groupOf(1), TaskGroup.tomorrow);
    expect(groupOf(2), TaskGroup.thisWeek);
    expect(groupOf(7), TaskGroup.thisWeek);
    expect(groupOf(8), TaskGroup.later);
  });

  test('dueLabel wording, including singular "1 day"', () {
    expect(dueLabel(-3), '3 days overdue');
    expect(dueLabel(-1), '1 day overdue');
    expect(dueLabel(0), 'Due today');
    expect(dueLabel(1), 'Tomorrow');
    expect(dueLabel(5), 'In 5 days');
  });

  test('urgency colors: light and dark differ; done uses the theme outline', () {
    final light = ColorScheme.fromSeed(seedColor: Colors.indigo);
    final dark = ColorScheme.fromSeed(seedColor: Colors.indigo, brightness: Brightness.dark);
    for (final u in [Urgency.overdue, Urgency.soon, Urgency.later]) {
      expect(urgencyColor(u, light), isNot(urgencyColor(u, dark)), reason: '$u');
    }
    expect(urgencyColor(Urgency.done, light), light.outline);
    expect(urgencyColor(Urgency.overdue, light), Colors.red.shade700);
    expect(urgencyColor(Urgency.overdue, dark), Colors.red.shade300);
  });

  test('formatDue: weekday/month names, month and year edges, no shift', () {
    expect(formatDue('2026-11-28'), 'Sat 28 Nov');
    expect(formatDue('2026-11-26'), 'Thu 26 Nov');
    expect(formatDue('2026-12-31'), 'Thu 31 Dec');
    expect(formatDue('2027-01-01'), 'Fri 1 Jan');
    expect(formatDue('2028-02-29'), 'Tue 29 Feb'); // leap day
  });
}

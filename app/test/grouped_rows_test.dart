import 'package:flutter_test/flutter_test.dart';

import 'package:duesoon/models/task.dart';
import 'package:duesoon/utils/urgency.dart';
import 'package:duesoon/widgets/grouped_task_list.dart';

Task task(int id, int daysLeft) => Task(
      id: id, title: 'T$id', type: 'quiz', dueDate: '2026-11-26', courseId: 1,
      courseCode: 'CSC452', courseName: 'Mobile Programming', done: false, daysLeft: daysLeft,
    );

String describe(List<ListRow> rows) => rows
    .map((r) => switch (r) {
          HeaderRow(:final group) => '[${group.name}]',
          TaskRow(:final task) => '${task.id}',
        })
    .join(' ');

void main() {
  test('groups in fixed order, empty groups have no header, API order kept', () {
    // API order: due date asc. No "tomorrow" task, so no Tomorrow header.
    final rows = groupedRows([task(1, -2), task(2, -1), task(3, 0), task(4, 2), task(5, 7), task(6, 8)]);
    expect(describe(rows), '[overdue] 1 2 [today] 3 [thisWeek] 4 5 [later] 6');
  });

  test('no tasks → no rows', () {
    expect(groupedRows([]), isEmpty);
  });

  test('Done tab: flat, no headers, order unchanged', () {
    expect(describe(flatRows([task(9, 5), task(8, -3)])), '9 8');
  });

  test('header urgency colors follow the group', () {
    expect(TaskGroup.overdue.headerUrgency, Urgency.overdue);
    expect(TaskGroup.today.headerUrgency, Urgency.soon);
    expect(TaskGroup.later.headerUrgency, Urgency.later);
  });
}

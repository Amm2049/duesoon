import '../models/task.dart';
import '../utils/urgency.dart';

/// One row of a task list: either a day-group header or a task (§6.1).
/// One flat list keeps it to a single ListView.builder, no extra packages.
sealed class ListRow {}

class HeaderRow extends ListRow {
  final TaskGroup group;
  HeaderRow(this.group);
}

class TaskRow extends ListRow {
  final Task task;
  TaskRow(this.task);
}

/// Tasks (already sorted by the API) → headers + tasks, groups in fixed order,
/// a header only when its group has tasks. Order inside a group is kept.
List<ListRow> groupedRows(List<Task> tasks) {
  final byGroup = {for (final g in TaskGroup.values) g: <Task>[]};
  for (final t in tasks) {
    byGroup[groupOf(t.daysLeft)]!.add(t);
  }
  return [
    for (final g in TaskGroup.values)
      if (byGroup[g]!.isNotEmpty) ...[
        HeaderRow(g),
        for (final t in byGroup[g]!) TaskRow(t),
      ],
  ];
}

/// Done tab: no headers, API order (most recently finished first).
List<ListRow> flatRows(List<Task> tasks) => [for (final t in tasks) TaskRow(t)];

import 'package:material_ui/material_ui.dart';

import '../models/task.dart';
import '../utils/date_format.dart';
import '../utils/urgency.dart';

/// One task in a list (§6.1): 4 px urgency strip · title · type chip · checkbox.
/// Subtitle "CSC452 · Due today" in the urgency color; done tasks are grey + struck through.
class TaskCard extends StatelessWidget {
  final Task task;
  final bool busy; // a done/undo request for this task is running
  final ValueChanged<bool> onToggleDone;
  final VoidCallback? onTap; // opens S5 detail

  const TaskCard({
    super.key,
    required this.task,
    required this.onToggleDone,
    this.busy = false,
    this.onTap,
  });

  static String typeLabel(String type) => switch (type) {
        'assignment' => 'Assignment',
        'quiz' => 'Quiz',
        'exam' => 'Exam',
        _ => type,
      };

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = urgencyColor(urgencyOf(task.daysLeft, task.done), theme.colorScheme);
    final when = task.done ? 'Due ${formatDue(task.dueDate)}' : dueLabel(task.daysLeft);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: color),
            // Not a ListTile: its fixed height clipped the subtitle when a title wrapped.
            Expanded(
              child: InkWell(
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              task.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.titleMedium?.copyWith(
                                decoration: task.done ? TextDecoration.lineThrough : null,
                                color: task.done ? theme.colorScheme.onSurfaceVariant : null,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${task.courseCode} · $when',
                              style: theme.textTheme.bodyMedium?.copyWith(color: color),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      TypeChip(type: task.type, compact: true),
                      SizedBox(
                        width: 48,
                        height: 48,
                        child: busy
                            ? const Padding(
                                padding: EdgeInsets.all(14),
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Checkbox(
                                value: task.done,
                                semanticLabel:
                                    task.done ? 'Mark as not done' : 'Mark as done',
                                onChanged: (v) => onToggleDone(v ?? false),
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The "Quiz" / "Assignment" / "Exam" label. Flutter's [Chip] tells screen readers it is a
/// checkbox (found in the web check, Step 9), so its own semantics are replaced by plain text.
class TypeChip extends StatelessWidget {
  final String type;
  final bool compact;

  const TypeChip({super.key, required this.type, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final label = TaskCard.typeLabel(type);
    return Semantics(
      container: true, // its own node, read as plain text
      label: label,
      excludeSemantics: true,
      child: Chip(
        label: Text(label),
        labelStyle: compact ? Theme.of(context).textTheme.labelSmall : null,
        visualDensity: compact ? VisualDensity.compact : null,
        padding: compact ? EdgeInsets.zero : null,
      ),
    );
  }
}

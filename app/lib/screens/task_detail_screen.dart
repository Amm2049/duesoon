import 'package:material_ui/material_ui.dart';

import '../models/task.dart';
import '../services/api_service.dart';
import '../utils/api_errors.dart';
import '../utils/date_format.dart';
import '../utils/urgency.dart';
import '../widgets/task_card.dart';
import 'task_form_screen.dart';

/// S5: one task, the shared done count (D-20), my done button,
/// and Edit/Delete for the creator only (D-15; the server enforces it too).
/// Pops with `true` if anything changed, so the list reloads.
class TaskDetailScreen extends StatefulWidget {
  final int taskId;
  final ApiService api;

  const TaskDetailScreen({super.key, required this.taskId, required this.api});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  Task? _task;
  bool _busy = false; // done toggle or delete running
  bool _changed = false;
  bool _closing = false;
  Future<void>? _request; // the running done toggle or delete

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Remembers a running request so [_close] can wait for it.
  void _track(Future<void> request) => _request = request;

  /// Back to the list, reporting `_changed`. If a request is still running,
  /// wait for the server first: otherwise the list would not reload, or would
  /// reload before the change is saved (back pressed while the spinner shows).
  Future<void> _close() async {
    if (_closing) return; // back pressed twice
    _closing = true;
    try {
      await _request;
    } catch (_) {
      // Errors were already shown by the request itself.
    }
    if (mounted) Navigator.pop(context, _changed);
  }

  /// 404/403 on a task: tell the user and go back to a refreshed list.
  bool _handleGone(ApiException e) {
    if (e.status != 404 && e.status != 403) return false;
    final text = e.status == 404 ? 'This task was deleted' : e.message;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
    _changed = true;
    _close();
    return true;
  }

  Future<void> _load() async {
    try {
      final task = await widget.api.getTask(widget.taskId);
      if (mounted) setState(() => _task = task);
    } on ApiException catch (e) {
      if (!mounted || _handleGone(e)) return;
      showApiError(context, e);
    }
  }

  Future<void> _toggleDone() async {
    final task = _task;
    if (task == null || _busy) return;
    setState(() => _busy = true);
    try {
      await widget.api.setDone(task.id, !task.done);
      _changed = true;
      await _load(); // fresh done flag + count from the server (D-46)
    } on ApiException catch (e) {
      if (mounted && !_handleGone(e)) showApiError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _edit() async {
    final task = _task;
    if (task == null) return;
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TaskFormScreen(api: widget.api, existing: task)),
    );
    if (saved == true) {
      _changed = true;
      await _load();
    }
  }

  Future<void> _delete() async {
    final task = _task;
    if (task == null || _busy) return;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this task?'),
        content: Text('"${task.title}" will be removed for the whole class.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            key: const Key('confirm-delete'),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() => _busy = true);
    try {
      await widget.api.deleteTask(task.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Task deleted')));
      _changed = true;
      _close();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      if (!_handleGone(e)) showApiError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final task = _task;
    final isOwner = task?.isOwner == true;

    return PopScope(
      canPop: false, // back button/gesture returns `_changed` to the list
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _close();
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Task'),
          actions: [
            if (isOwner) ...[
              IconButton(
                key: const Key('edit-task'),
                tooltip: 'Edit',
                icon: const Icon(Icons.edit_outlined),
                onPressed: _busy ? null : _edit,
              ),
              IconButton(
                key: const Key('delete-task'),
                tooltip: 'Delete',
                icon: const Icon(Icons.delete_outline),
                onPressed: _busy ? null : () => _track(_delete()),
              ),
            ],
          ],
        ),
        body: task == null
            ? const Center(child: CircularProgressIndicator())
            : _details(context, task),
        bottomNavigationBar: task == null
            ? null
            : SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: _doneButton(task),
                ),
              ),
      ),
    );
  }

  Widget _details(BuildContext context, Task task) {
    final theme = Theme.of(context);
    final color = urgencyColor(urgencyOf(task.daysLeft, task.done), theme.colorScheme);
    final when = task.done ? 'Done' : dueLabel(task.daysLeft);
    final description = task.description;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(task.title, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerLeft,
          child: TypeChip(type: task.type),
        ),
        const SizedBox(height: 16),
        _InfoRow(
          icon: Icons.event,
          text: '${formatDue(task.dueDate)} · $when',
          color: color,
        ),
        _InfoRow(icon: Icons.menu_book_outlined, text: '${task.courseCode} ${task.courseName}'),
        _InfoRow(icon: Icons.person_outline, text: 'Added by ${task.creatorName ?? 'someone'}'),
        const Divider(height: 32),
        Text('Description', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        Text(
          description ?? 'No description',
          style: description == null
              ? theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)
              : theme.textTheme.bodyLarge,
        ),
        const Divider(height: 32),
        _InfoRow(icon: Icons.groups_outlined, text: doneCountText(task.doneCount ?? 0)),
      ],
    );
  }

  Widget _doneButton(Task task) {
    void onPressed() => _track(_toggleDone());
    final child = _busy
        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
        : Text(task.done ? 'Mark as not done' : 'Mark as done');
    // Filled when there is something to do; outlined once done (less prominent).
    return SizedBox(
      width: double.infinity,
      child: task.done
          ? OutlinedButton.icon(
              key: const Key('toggle-done'),
              onPressed: _busy ? null : onPressed,
              icon: const Icon(Icons.undo),
              label: child,
            )
          : FilledButton.icon(
              key: const Key('toggle-done'),
              onPressed: _busy ? null : onPressed,
              icon: const Icon(Icons.check),
              label: child,
            ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;

  const _InfoRow({required this.icon, required this.text, this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 24, color: color ?? theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 16),
          Expanded(
            child: Text(text, style: theme.textTheme.bodyLarge?.copyWith(color: color)),
          ),
        ],
      ),
    );
  }
}

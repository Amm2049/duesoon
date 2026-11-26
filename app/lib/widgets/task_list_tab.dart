import 'package:material_ui/material_ui.dart';

import '../models/task.dart';
import '../screens/task_detail_screen.dart';
import '../services/api_service.dart';
import '../utils/api_errors.dart';
import 'empty_state.dart';
import 'group_header.dart';
import 'grouped_task_list.dart';
import 'task_card.dart';

/// One Home tab (This Week / All / Done). Loads its own data with setState (D-09)
/// every time it is shown, and on pull-to-refresh.
class TaskListTab extends StatefulWidget {
  final String filter; // week | all | done
  final ApiService api;

  const TaskListTab({super.key, required this.filter, required this.api});

  @override
  State<TaskListTab> createState() => _TaskListTabState();
}

class _TaskListTabState extends State<TaskListTab> {
  List<Task>? _tasks; // null until the first load succeeds
  bool _failed = false;
  final Set<int> _busy = {}; // task ids with a done/undo request running

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final tasks = await widget.api.getTasks(widget.filter);
      if (!mounted) return;
      setState(() {
        _tasks = tasks;
        _failed = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _failed = true);
      showApiError(context, e);
    }
  }

  /// D-46: wait for the server, then reload, so the list always matches the API.
  Future<void> _toggleDone(Task task, bool done) async {
    if (_busy.contains(task.id)) return; // ignore double taps
    setState(() => _busy.add(task.id));
    try {
      await widget.api.setDone(task.id, done);
      await _load();
    } on ApiException catch (e) {
      if (mounted) showApiError(context, e);
    } finally {
      if (mounted) setState(() => _busy.remove(task.id));
    }
  }

  /// S5; reload when it reports a change (refresh rule, §6).
  Future<void> _openDetail(Task task) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TaskDetailScreen(taskId: task.id, api: widget.api)),
    );
    if (changed == true && mounted) await _load();
  }

  ({IconData icon, String text}) get _empty => switch (widget.filter) {
        'week' => (icon: Icons.celebration, text: 'Nothing due this week 🎉'),
        'done' => (icon: Icons.task_alt, text: 'Nothing finished yet'),
        _ => (icon: Icons.playlist_add, text: 'No tasks yet. Tap + to add one'),
      };

  @override
  Widget build(BuildContext context) {
    final tasks = _tasks;
    if (tasks == null && !_failed) {
      return const Center(child: CircularProgressIndicator());
    }

    final Widget body;
    if (tasks == null || tasks.isEmpty) {
      // Still scrollable so pull-to-refresh works on an empty or failed list.
      final e = tasks == null
          ? (icon: Icons.cloud_off, text: "Couldn't load tasks. Pull to retry.")
          : _empty;
      body = LayoutBuilder(
        builder: (context, constraints) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: constraints.maxHeight,
              child: EmptyState(icon: e.icon, text: e.text),
            ),
          ],
        ),
      );
    } else {
      final rows = widget.filter == 'done' ? flatRows(tasks) : groupedRows(tasks);
      body = ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 88), // room for the + button
        itemCount: rows.length,
        itemBuilder: (context, i) => switch (rows[i]) {
          HeaderRow(:final group) => GroupHeader(group: group),
          TaskRow(:final task) => TaskCard(
              key: ValueKey(task.id),
              task: task,
              busy: _busy.contains(task.id),
              onToggleDone: (done) => _toggleDone(task, done),
              onTap: () => _openDetail(task),
            ),
        },
      );
    }

    return RefreshIndicator(onRefresh: _load, child: body);
  }
}

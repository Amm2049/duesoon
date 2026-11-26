import 'package:material_ui/material_ui.dart';

import '../models/course.dart';
import '../models/task.dart';
import '../services/api_service.dart';
import '../utils/api_errors.dart';
import '../utils/date_format.dart';
import '../utils/dates.dart';
import '../utils/validators.dart';

/// S6: add a task (existing == null) or edit one. Pops with `true` after saving.
class TaskFormScreen extends StatefulWidget {
  final ApiService api;
  final Task? existing;

  const TaskFormScreen({super.key, required this.api, this.existing});

  @override
  State<TaskFormScreen> createState() => _TaskFormScreenState();
}

class _TaskFormScreenState extends State<TaskFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _dateFieldKey = GlobalKey<FormFieldState<String>>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  late String _type;
  String? _dueDate;
  int? _courseId;
  List<Course>? _courses;
  bool _coursesFailed = false;
  bool _saving = false;

  bool get _isCreate => widget.existing == null;

  // D-47: "today" is the Bangkok date, like the server.
  final String _today = todayBangkok();

  @override
  void initState() {
    super.initState();
    final t = widget.existing;
    _title = TextEditingController(text: t?.title ?? '');
    _description = TextEditingController(text: t?.description ?? '');
    _type = t?.type ?? 'assignment';
    _dueDate = t?.dueDate;
    _courseId = t?.courseId;
    _loadCourses();
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _loadCourses() async {
    setState(() => _coursesFailed = false);
    try {
      final courses = await widget.api.getCourses();
      if (!mounted) return;
      setState(() {
        _courses = courses;
        // Pre-select CSC452 on create (D-27); keep the task's course on edit.
        _courseId ??= courses
                .where((c) => c.code == 'CSC452')
                .map((c) => c.id)
                .firstOrNull ??
            courses.firstOrNull?.id;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _coursesFailed = true);
      showApiError(context, e);
    }
  }

  Future<void> _pickDate() async {
    // Picker works with local dates; only year/month/day matter.
    DateTime local(String ymd) {
      final d = fromYmd(ymd);
      return DateTime(d.year, d.month, d.day);
    }

    // Edit: an overdue task keeps its date selectable (D-19).
    var first = _today;
    if (!_isCreate && _dueDate != null && _dueDate!.compareTo(_today) < 0) first = _dueDate!;
    final last = addDays(_today, 365);
    var initial = _dueDate ?? _today;
    if (initial.compareTo(first) < 0) initial = first;
    if (initial.compareTo(last) > 0) initial = last;

    final picked = await showDatePicker(
      context: context,
      firstDate: local(first),
      lastDate: local(last),
      initialDate: local(initial),
      helpText: 'Due date',
    );
    if (picked == null) return;
    final ymd = toYmd(picked);
    setState(() => _dueDate = ymd);
    _dateFieldKey.currentState?.didChange(ymd);
  }

  Future<void> _save() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    final input = TaskInput(
      title: _title.text,
      courseId: _courseId!,
      type: _type,
      dueDate: _dueDate!,
      description: _description.text.trim().isEmpty ? null : _description.text,
    );

    setState(() => _saving = true);
    try {
      if (_isCreate) {
        await widget.api.createTask(input);
      } else {
        await widget.api.updateTask(widget.existing!.id, input);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_isCreate ? 'Task added' : 'Task saved')),
      );
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      final messenger = ScaffoldMessenger.of(context);
      switch (e.status) {
        case 400:
          // Server is the rule: show its reason (e.g. date already in the past).
          messenger.showSnackBar(SnackBar(content: Text(e.message)));
        case 403 || 404:
          messenger.showSnackBar(SnackBar(
            content: Text(e.status == 404 ? 'This task was deleted' : e.message),
          ));
          Navigator.pop(context, true);
        default:
          showApiError(context, e);
      }
    }
  }

  InputDecoration _field(String label, IconData icon) => InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: const OutlineInputBorder(),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isCreate ? 'Add task' : 'Edit task')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              TextFormField(
                key: const Key('task-title'),
                controller: _title,
                decoration: _field('Title', Icons.title),
                textCapitalization: TextCapitalization.sentences,
                maxLength: 100,
                validator: Validators.title,
              ),
              const SizedBox(height: 8),
              _courseField(),
              const SizedBox(height: 16),
              SegmentedButton<String>(
                // Text only: with icons, "Assignment" wrapped to two lines on a phone.
                segments: const [
                  ButtonSegment(value: 'assignment', label: Text('Assignment')),
                  ButtonSegment(value: 'quiz', label: Text('Quiz')),
                  ButtonSegment(value: 'exam', label: Text('Exam')),
                ],
                selected: {_type},
                showSelectedIcon: false,
                onSelectionChanged: (s) => setState(() => _type = s.first),
              ),
              const SizedBox(height: 16),
              FormField<String>(
                key: _dateFieldKey,
                initialValue: _dueDate,
                validator: (v) => Validators.dueDate(v, today: _today, isCreate: _isCreate),
                builder: (state) => InkWell(
                  key: const Key('task-date'),
                  onTap: _pickDate,
                  borderRadius: BorderRadius.circular(4),
                  child: InputDecorator(
                    decoration: _field('Due date', Icons.event).copyWith(errorText: state.errorText),
                    child: Text(_dueDate == null ? 'Pick a date' : formatDue(_dueDate!)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                key: const Key('task-description'),
                controller: _description,
                decoration: _field('Description (optional)', Icons.notes).copyWith(alignLabelWithHint: true),
                minLines: 3,
                maxLines: 8,
                maxLength: 1000,
                validator: Validators.description,
              ),
              const SizedBox(height: 16),
              FilledButton(
                key: const Key('task-save'),
                onPressed: _saving || _courses == null ? null : _save,
                child: _saving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(_isCreate ? 'Add task' : 'Save changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _courseField() {
    final courses = _courses;
    if (courses == null) {
      return _coursesFailed
          ? OutlinedButton.icon(
              onPressed: _loadCourses,
              icon: const Icon(Icons.refresh),
              label: const Text("Couldn't load courses. Retry"),
            )
          : const LinearProgressIndicator();
    }
    return DropdownButtonFormField<int>(
      initialValue: _courseId,
      decoration: _field('Course', Icons.menu_book_outlined),
      items: [
        for (final c in courses)
          DropdownMenuItem(value: c.id, child: Text('${c.code} ${c.name}', overflow: TextOverflow.ellipsis)),
      ],
      onChanged: (id) => setState(() => _courseId = id),
      validator: (id) => id == null ? 'Course is required' : null,
      isExpanded: true,
    );
  }
}

/// Body of `POST /tasks` and `PUT /tasks/:id` (SPEC §4.2 TaskInput).
class TaskInput {
  final String title;
  final int courseId;
  final String type;
  final String dueDate;
  final String? description;

  const TaskInput({
    required this.title,
    required this.courseId,
    required this.type,
    required this.dueDate,
    this.description,
  });

  Map<String, dynamic> toJson() => {
        'title': title.trim(),
        'course_id': courseId,
        'type': type,
        'due_date': dueDate,
        'description': description?.trim(),
      };
}

/// A task from `GET /tasks` (list item) or `GET /tasks/:id` (detail), SPEC §4.2.
/// Detail-only fields are null on list items.
/// `dueDate` stays a "YYYY-MM-DD" string and `daysLeft` comes from the API:
/// the app never computes it (SPEC §5).
class Task {
  final int id;
  final String title;
  final String type; // assignment | exam | quiz
  final String dueDate;
  final int courseId;
  final String courseCode;
  final String courseName;
  final bool done;
  final int daysLeft;

  // Detail only
  final String? description;
  final int? createdBy;
  final String? creatorName;
  final bool? isOwner;
  final int? doneCount;

  const Task({
    required this.id,
    required this.title,
    required this.type,
    required this.dueDate,
    required this.courseId,
    required this.courseCode,
    required this.courseName,
    required this.done,
    required this.daysLeft,
    this.description,
    this.createdBy,
    this.creatorName,
    this.isOwner,
    this.doneCount,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as int,
      title: json['title'] as String,
      type: json['type'] as String,
      dueDate: json['due_date'] as String,
      courseId: json['course_id'] as int,
      courseCode: json['course_code'] as String,
      courseName: json['course_name'] as String,
      done: json['done'] as bool,
      daysLeft: json['days_left'] as int,
      description: json['description'] as String?,
      createdBy: json['created_by'] as int?,
      creatorName: json['creator_name'] as String?,
      isOwner: json['is_owner'] as bool?,
      doneCount: json['done_count'] as int?,
    );
  }
}

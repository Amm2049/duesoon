import 'package:flutter_test/flutter_test.dart';

import 'package:duesoon/models/course.dart';
import 'package:duesoon/models/task.dart';
import 'package:duesoon/models/user.dart';

// JSON shapes from SPEC §4.2.
void main() {
  test('User from /login (with email) and /me (without)', () {
    final a = User.fromJson({'id': 1, 'name': 'Mai', 'email': 'mai@duesoon.test'});
    expect([a.id, a.name, a.email], [1, 'Mai', 'mai@duesoon.test']);
    final b = User.fromJson({'id': 1, 'name': 'Mai'});
    expect(b.email, isNull);
  });

  test('Course', () {
    final c = Course.fromJson({'id': 1, 'code': 'CSC452', 'name': 'Mobile Programming'});
    expect([c.id, c.code, c.name], [1, 'CSC452', 'Mobile Programming']);
  });

  const listItem = {
    'id': 7, 'title': 'Lab 6: Full CRUD', 'type': 'assignment', 'due_date': '2026-11-28',
    'course_id': 1, 'course_code': 'CSC452', 'course_name': 'Mobile Programming',
    'done': false, 'days_left': 2,
  };

  test('Task list item: detail fields are null', () {
    final t = Task.fromJson(listItem);
    expect(t.dueDate, '2026-11-28'); // stays a string, no time zone shift
    expect(t.daysLeft, 2);
    expect(t.done, isFalse);
    expect(t.description, isNull);
    expect(t.isOwner, isNull);
  });

  test('Task detail (negative days_left, null description)', () {
    final t = Task.fromJson({
      ...listItem, 'days_left': -3, 'description': null, 'created_by': 3,
      'creator_name': 'Mai', 'is_owner': true, 'done_count': 12,
    });
    expect(t.daysLeft, -3);
    expect(t.description, isNull);
    expect([t.createdBy, t.creatorName, t.isOwner, t.doneCount], [3, 'Mai', true, 12]);
  });
}

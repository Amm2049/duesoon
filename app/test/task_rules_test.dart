import 'package:flutter_test/flutter_test.dart';

import 'package:duesoon/models/task.dart';
import 'package:duesoon/utils/dates.dart';
import 'package:duesoon/utils/urgency.dart';
import 'package:duesoon/utils/validators.dart';

// Mirrors validateTask in api/src/lib/validate.js and todayBangkok in dates.js.
void main() {
  group('todayBangkok (D-12, D-47)', () {
    test('00:30 in Bangkok is already the next day while UTC is still yesterday', () {
      expect(todayBangkok(DateTime.utc(2026, 11, 25, 17, 30)), '2026-11-26');
    });
    test('23:59 Bangkok stays the same day', () {
      expect(todayBangkok(DateTime.utc(2026, 11, 26, 16, 59)), '2026-11-26');
    });
    test('exactly midnight Bangkok rolls over', () {
      expect(todayBangkok(DateTime.utc(2026, 11, 26, 17, 0)), '2026-11-27');
    });
  });

  test('addDays / toYmd cross month + year, zero-padded', () {
    expect(addDays('2026-12-31', 1), '2027-01-01');
    expect(addDays('2026-03-01', -1), '2026-02-28');
    expect(toYmd(DateTime(2027, 1, 5)), '2027-01-05');
  });

  group('title', () {
    test('required after trim; 100 ok, 101 too long', () {
      expect(Validators.title('   '), 'Title is required');
      expect(Validators.title('a' * 100), isNull);
      expect(Validators.title('a' * 101), 'Title must be at most 100 characters');
    });
  });

  test('description optional, max 1000 after trim', () {
    expect(Validators.description(''), isNull);
    expect(Validators.description('${'a' * 1000}   '), isNull);
    expect(Validators.description('a' * 1001), 'Description must be at most 1000 characters');
  });

  group('due date window (D-19), today = 2026-11-26', () {
    const today = '2026-11-26';
    String? create(String? d) => Validators.dueDate(d, today: today, isCreate: true);
    String? edit(String? d) => Validators.dueDate(d, today: today, isCreate: false);

    test('missing → pick one', () => expect(create(null), 'Pick a due date'));
    test('create: yesterday no, today yes', () {
      expect(create('2026-11-25'), 'Due date cannot be in the past');
      expect(create(today), isNull);
    });
    test('edit: yesterday is allowed (fix an overdue task)', () {
      expect(edit('2026-11-25'), isNull);
    });
    test('both: today+365 yes, today+366 no', () {
      expect(create('2027-11-26'), isNull);
      expect(create('2027-11-27'), 'Due date must be within one year');
      expect(edit('2027-11-27'), 'Due date must be within one year');
    });
  });

  test('doneCountText (D-20)', () {
    expect(doneCountText(0), 'Nobody has finished this yet');
    expect(doneCountText(1), '1 classmate finished this');
    expect(doneCountText(12), '12 classmates finished this');
  });

  test('TaskInput JSON: snake_case, trimmed, null description', () {
    const input = TaskInput(title: '  Lab 8 ', courseId: 1, type: 'quiz', dueDate: '2026-12-03');
    expect(input.toJson(), {
      'title': 'Lab 8', 'course_id': 1, 'type': 'quiz', 'due_date': '2026-12-03', 'description': null,
    });
  });
}

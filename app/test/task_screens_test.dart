import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/models/task.dart';
import 'package:duesoon/models/user.dart';
import 'package:duesoon/screens/task_detail_screen.dart';
import 'package:duesoon/screens/task_form_screen.dart';
import 'package:duesoon/services/api_service.dart';
import 'package:duesoon/services/session.dart';

Map<String, dynamic> detail({bool owner = true, bool done = false, int count = 0}) => {
      'id': 7, 'title': 'Lab 6: Full CRUD', 'type': 'assignment', 'due_date': '2026-11-27',
      'course_id': 1, 'course_code': 'CSC452', 'course_name': 'Mobile Programming',
      'done': done, 'days_left': 1, 'description': 'Submit GitHub link on LMS',
      'created_by': 1, 'creator_name': 'Mai', 'is_owner': owner, 'done_count': count,
    };

http.Response json(Object body, [int status = 200]) =>
    http.Response(jsonEncode(body), status, headers: {'content-type': 'application/json'});

/// Opens [screen] from a button and records what it pops with.
class Launcher extends StatefulWidget {
  final Widget screen;
  const Launcher(this.screen, {super.key});
  @override
  State<Launcher> createState() => LauncherState();
}

class LauncherState extends State<Launcher> {
  Object? result = 'not popped';
  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: TextButton(
            onPressed: () async {
              final r = await Navigator.push(context, MaterialPageRoute(builder: (_) => widget.screen));
              setState(() => result = r);
            },
            child: Text('open · result=$result'),
          ),
        ),
      );
}

void main() {
  late List<String> requests;

  ApiService api(Future<http.Response> Function(http.Request req) handler) => ApiService(
        baseUrl: 'https://api.test',
        client: MockClient((req) {
          requests.add('${req.method} ${req.url.path}');
          return handler(req);
        }),
      );

  Future<void> open(WidgetTester tester, Widget screen) async {
    await tester.pumpWidget(MaterialApp(home: Launcher(screen)));
    await tester.tap(find.textContaining('open'));
    await tester.pumpAndSettle();
  }

  setUp(() {
    requests = [];
    Session.start('tok', const User(id: 1, name: 'Mai'));
  });

  group('S5 detail', () {
    testWidgets('owner sees Edit/Delete; info rows and done count', (tester) async {
      await open(tester, TaskDetailScreen(taskId: 7, api: api((_) async => json(detail(count: 2)))));
      expect(find.byKey(const Key('edit-task')), findsOneWidget);
      expect(find.byKey(const Key('delete-task')), findsOneWidget);
      expect(find.text('Fri 27 Nov · Tomorrow'), findsOneWidget);
      expect(find.text('Added by Mai'), findsOneWidget);
      expect(find.text('2 classmates finished this'), findsOneWidget);
    });

    testWidgets('non-owner sees no Edit/Delete', (tester) async {
      await open(tester, TaskDetailScreen(taskId: 7, api: api((_) async => json(detail(owner: false)))));
      expect(find.byKey(const Key('edit-task')), findsNothing);
      expect(find.byKey(const Key('delete-task')), findsNothing);
    });

    testWidgets('Mark as done → POST, count + button update, pops true', (tester) async {
      var done = false;
      await open(tester, TaskDetailScreen(taskId: 7, api: api((req) async {
        if (req.method == 'POST') {
          done = true;
          return json({'done': true, 'done_count': 1});
        }
        return json(detail(done: done, count: done ? 1 : 0));
      })));
      expect(find.text('Nobody has finished this yet'), findsOneWidget);
      await tester.tap(find.byKey(const Key('toggle-done')));
      await tester.pumpAndSettle();
      expect(requests, contains('POST /tasks/7/done'));
      expect(find.text('1 classmate finished this'), findsOneWidget);
      expect(find.text('Mark as not done'), findsOneWidget);

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('open · result=true'), findsOneWidget);
    });

    testWidgets('Delete asks first; Cancel sends nothing; confirm sends DELETE and pops true',
        (tester) async {
      await open(tester, TaskDetailScreen(taskId: 7, api: api((req) async {
        if (req.method == 'DELETE') return http.Response('', 204);
        return json(detail());
      })));
      await tester.tap(find.byKey(const Key('delete-task')));
      await tester.pumpAndSettle();
      expect(find.text('Delete this task?'), findsOneWidget);
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
      expect(requests.where((r) => r.startsWith('DELETE')), isEmpty);

      await tester.tap(find.byKey(const Key('delete-task')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const Key('confirm-delete')));
      await tester.pumpAndSettle();
      expect(requests, contains('DELETE /tasks/7'));
      expect(find.text('open · result=true'), findsOneWidget);
    });

    testWidgets('404 (deleted by its creator meanwhile) → message, pops true', (tester) async {
      await open(tester, TaskDetailScreen(taskId: 7, api: api((_) async => json({'error': 'Task not found'}, 404))));
      expect(find.text('This task was deleted'), findsOneWidget);
      expect(find.text('open · result=true'), findsOneWidget);
    });
  });

  group('S6 form', () {
    final courses = [
      {'id': 1, 'code': 'CSC452', 'name': 'Mobile Programming'},
    ];

    testWidgets('create: CSC452 pre-selected; empty title + no date → errors, no POST',
        (tester) async {
      await open(tester, TaskFormScreen(api: api((_) async => json(courses))));
      expect(find.text('CSC452 Mobile Programming'), findsOneWidget);
      await tester.tap(find.byKey(const Key('task-save')));
      await tester.pumpAndSettle();
      expect(find.text('Title is required'), findsOneWidget);
      expect(find.text('Pick a due date'), findsOneWidget);
      expect(requests.where((r) => r.startsWith('POST')), isEmpty);
    });

    testWidgets('edit: pre-filled; server 400 message shown, stays open', (tester) async {
      final existing = Task.fromJson(detail());
      await open(tester, TaskFormScreen(
        existing: existing,
        api: api((req) async => req.method == 'PUT'
            ? json({'error': 'Due date must be within one year'}, 400)
            : json(courses)),
      ));
      expect(find.text('Edit task'), findsOneWidget);
      expect(find.text('Fri 27 Nov'), findsOneWidget);
      await tester.tap(find.byKey(const Key('task-save')));
      await tester.pumpAndSettle();
      expect(requests, contains('PUT /tasks/7'));
      expect(find.text('Due date must be within one year'), findsOneWidget);
      expect(find.text('Edit task'), findsOneWidget);
    });

    testWidgets('edit: save sends trimmed snake_case body, pops true', (tester) async {
      Map<String, dynamic>? body;
      final existing = Task.fromJson(detail());
      await open(tester, TaskFormScreen(
        existing: existing,
        api: api((req) async {
          if (req.method == 'PUT') {
            body = jsonDecode(req.body) as Map<String, dynamic>;
            return json(detail());
          }
          return json(courses);
        }),
      ));
      await tester.enterText(find.byKey(const Key('task-title')), '  Lab 6: Full CRUD v2  ');
      await tester.tap(find.text('Quiz'));
      await tester.pump();
      await tester.tap(find.byKey(const Key('task-save')));
      await tester.pumpAndSettle();
      expect(body, {
        'title': 'Lab 6: Full CRUD v2', 'course_id': 1, 'type': 'quiz',
        'due_date': '2026-11-27', 'description': 'Submit GitHub link on LMS',
      });
      expect(find.text('open · result=true'), findsOneWidget);
    });
  });
}

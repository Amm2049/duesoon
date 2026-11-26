import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/screens/home_screen.dart';
import 'package:duesoon/services/api_service.dart';
import 'package:duesoon/services/session.dart';
import 'package:duesoon/models/user.dart';

/// A tiny fake of the API for one user: three tasks, per-user done set.
class FakeServer {
  final tasks = <Map<String, dynamic>>[
    _t(1, 'Lab 5: Forms', 'assignment', '2026-11-25', -1),
    _t(2, 'Quiz 3: HTTP & JSON', 'quiz', '2026-11-26', 0),
    _t(3, 'Midterm Exam', 'exam', '2026-12-01', 5),
  ];
  final done = <int>{};
  final requests = <String>[];
  int status = 200; // set to 401 to simulate an expired token

  static Map<String, dynamic> _t(int id, String title, String type, String due, int days) => {
        'id': id, 'title': title, 'type': type, 'due_date': due, 'course_id': 1,
        'course_code': 'CSC452', 'course_name': 'Mobile Programming', 'days_left': days,
      };

  http.Response _json(Object body, [int code = 200]) =>
      http.Response(jsonEncode(body), code, headers: {'content-type': 'application/json'});

  Future<http.Response> handle(http.Request req) async {
    requests.add('${req.method} ${req.url.path}${req.url.query.isEmpty ? '' : '?${req.url.query}'}');
    if (status != 200) return _json({'error': 'Not logged in'}, status);

    final doneMatch = RegExp(r'^/tasks/(\d+)/done$').firstMatch(req.url.path);
    if (doneMatch != null) {
      final id = int.parse(doneMatch.group(1)!);
      req.method == 'POST' ? done.add(id) : done.remove(id);
      return _json({'done': req.method == 'POST', 'done_count': done.length});
    }
    if (req.url.path == '/tasks') {
      final all = [for (final t in tasks) {...t, 'done': done.contains(t['id'])}];
      final list = switch (req.url.queryParameters['filter']) {
        'week' => all.where((t) => t['done'] == false && (t['days_left'] as int) <= 7).toList(),
        'done' => all.where((t) => t['done'] == true).toList(),
        _ => all,
      };
      return _json(list);
    }
    return _json({'error': 'Not found'}, 404);
  }
}

void main() {
  late FakeServer server;

  Future<void> pumpHome(WidgetTester tester) async {
    final api = ApiService(baseUrl: 'https://api.test', client: MockClient(server.handle));
    await tester.pumpWidget(MaterialApp(home: HomeScreen(api: api)));
    await tester.pumpAndSettle();
  }

  Finder checkboxOf(String title) => find.descendant(
        of: find.ancestor(of: find.text(title), matching: find.byType(Card)),
        matching: find.byType(Checkbox),
      );

  setUp(() {
    server = FakeServer();
    Session.start('tok', const User(id: 1, name: 'Mai'));
  });

  testWidgets('This Week: day headers + cards with urgency labels', (tester) async {
    await pumpHome(tester);
    expect(server.requests, contains('GET /tasks?filter=week'));
    expect(find.text('OVERDUE'), findsOneWidget);
    expect(find.text('TODAY'), findsOneWidget);
    expect(find.text('TOMORROW'), findsNothing); // empty group → no header
    expect(find.text('THIS WEEK'), findsOneWidget);
    expect(find.text('CSC452 · 1 day overdue'), findsOneWidget);
    expect(find.text('CSC452 · Due today'), findsOneWidget);
    expect(find.text('CSC452 · In 5 days'), findsOneWidget);
    expect(find.text('Quiz'), findsOneWidget); // type chip
  });

  testWidgets('ticking a task sends POST, then the reloaded list drops it', (tester) async {
    await pumpHome(tester);
    await tester.tap(checkboxOf('Quiz 3: HTTP & JSON'));
    await tester.pumpAndSettle();
    expect(server.requests, contains('POST /tasks/2/done'));
    expect(server.requests.where((r) => r == 'GET /tasks?filter=week').length, 2);
    expect(find.text('Quiz 3: HTTP & JSON'), findsNothing);
    expect(find.text('TODAY'), findsNothing);
  });

  testWidgets('Done tab: flat list, ticked; unticking sends DELETE', (tester) async {
    server.done.add(1);
    await pumpHome(tester);
    await tester.tap(find.text('Done'));
    await tester.pumpAndSettle();
    expect(find.text('OVERDUE'), findsNothing); // no headers on Done
    expect(find.text('CSC452 · Due Wed 25 Nov'), findsOneWidget);
    final box = tester.widget<Checkbox>(checkboxOf('Lab 5: Forms'));
    expect(box.value, isTrue);

    await tester.tap(checkboxOf('Lab 5: Forms'));
    await tester.pumpAndSettle();
    expect(server.requests, contains('DELETE /tasks/1/done'));
    expect(find.text('Nothing finished yet'), findsOneWidget);
  });

  testWidgets('empty This Week shows its empty state', (tester) async {
    server.done.addAll([1, 2, 3]);
    await pumpHome(tester);
    expect(find.text('Nothing due this week 🎉'), findsOneWidget);
  });

  testWidgets('401 → session cleared, back to Login with a message', (tester) async {
    server.status = 401;
    await pumpHome(tester);
    expect(Session.isLoggedIn, isFalse);
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Session expired, please log in again'), findsOneWidget);
  });
}

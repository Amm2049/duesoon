import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/models/user.dart';
import 'package:duesoon/screens/home_screen.dart';
import 'package:duesoon/services/api_service.dart';
import 'package:duesoon/services/session.dart';

/// Going back from the detail screen while a request is still running must
/// still leave the list matching the server (bug: task stayed in This Week).

/// Fake API with one task; [gate] holds back the reply to done/delete requests.
class Server {
  bool done = false;
  bool deleted = false;
  Completer<void>? gate;

  http.Response _json(Object b) =>
      http.Response(jsonEncode(b), 200, headers: {'content-type': 'application/json'});

  Map<String, dynamic> get _task => {
        'id': 7, 'title': 'Lab 6', 'type': 'assignment', 'due_date': '2026-11-29',
        'course_id': 1, 'course_code': 'CSC452', 'course_name': 'Mobile Programming',
        'done': done, 'days_left': 1, 'description': null, 'created_by': 1,
        'creator_name': 'Mai', 'is_owner': true, 'done_count': done ? 1 : 0,
      };

  Future<http.Response> handle(http.Request req) async {
    if (req.url.path == '/tasks/7/done') {
      if (gate != null) await gate!.future; // slow server
      done = req.method == 'POST';
      return _json({'done': done, 'done_count': done ? 1 : 0});
    }
    if (req.url.path == '/tasks/7') {
      if (req.method == 'DELETE') {
        if (gate != null) await gate!.future;
        deleted = true;
        return http.Response('', 204);
      }
      return _json(_task);
    }
    final f = req.url.queryParameters['filter'];
    final show = !deleted && (f == 'week' ? !done : f == 'done' ? done : true);
    return _json(show ? [_task] : []);
  }
}

void main() {
  late Server server;

  Future<void> openDetail(WidgetTester tester) async {
    final api = ApiService(baseUrl: 'https://api.test', client: MockClient(server.handle));
    await tester.pumpWidget(MaterialApp(home: HomeScreen(api: api)));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lab 6'));
    await tester.pumpAndSettle();
  }

  setUp(() {
    server = Server();
    Session.start('tok', const User(id: 1, name: 'Mai'));
  });

  testWidgets('back after the button shows done → This Week drops it', (tester) async {
    await openDetail(tester);
    await tester.tap(find.byKey(const Key('toggle-done')));
    await tester.pumpAndSettle();
    expect(find.text('Mark as not done'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Lab 6'), findsNothing);
  });

  testWidgets('back while Mark as done is still running → waits, then This Week drops it',
      (tester) async {
    await openDetail(tester);
    server.gate = Completer();
    await tester.tap(find.byKey(const Key('toggle-done')));
    await tester.pump(); // spinner on the button, server hasn't answered
    await tester.pageBack();
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Task'), findsOneWidget, reason: 'still on detail, waiting for the server');

    server.gate!.complete();
    await tester.pumpAndSettle();
    expect(server.done, isTrue);
    expect(find.text('Task'), findsNothing, reason: 'back on the list');
    expect(find.text('Lab 6'), findsNothing, reason: 'list reloaded after the change');
  });

  testWidgets('back pressed twice while waiting → pops only the detail screen', (tester) async {
    await openDetail(tester);
    server.gate = Completer();
    await tester.tap(find.byKey(const Key('toggle-done')));
    await tester.pump();
    await tester.pageBack();
    await tester.pump();
    await tester.pageBack();
    server.gate!.complete();
    await tester.pumpAndSettle();
    expect(find.text('DueSoon'), findsOneWidget, reason: 'Home is still there');
    expect(find.text('Lab 6'), findsNothing);
  });

  testWidgets('back while Delete is still running → waits, then the list drops it',
      (tester) async {
    await openDetail(tester);
    await tester.tap(find.byKey(const Key('delete-task')));
    await tester.pumpAndSettle();
    server.gate = Completer();
    await tester.tap(find.byKey(const Key('confirm-delete')));
    await tester.pump();
    await tester.pageBack();
    await tester.pump(const Duration(seconds: 1));

    server.gate!.complete();
    await tester.pumpAndSettle();
    expect(server.deleted, isTrue);
    expect(find.text('DueSoon'), findsOneWidget, reason: 'Home is still there');
    expect(find.text('Lab 6'), findsNothing);
  });
}

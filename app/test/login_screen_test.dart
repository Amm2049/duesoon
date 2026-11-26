import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/screens/login_screen.dart';
import 'package:duesoon/services/api_service.dart';
import 'package:duesoon/services/session.dart';

void main() {
  late int calls;

  Future<void> pumpLogin(WidgetTester tester, int status, Object body) async {
    calls = 0;
    final api = ApiService(
      baseUrl: 'https://api.test',
      client: MockClient((req) async {
        // After a successful login, Home loads its tab: answer with an empty list.
        if (req.url.path == '/tasks') {
          return http.Response('[]', 200, headers: {'content-type': 'application/json'});
        }
        calls++;
        return http.Response(jsonEncode(body), status,
            headers: {'content-type': 'application/json'});
      }),
    );
    await tester.pumpWidget(MaterialApp(home: LoginScreen(api: api)));
  }

  final email = find.byKey(const Key('login-email'));
  final password = find.byKey(const Key('login-password'));
  final submit = find.byKey(const Key('login-submit'));

  setUp(Session.clear);

  testWidgets('empty form: shows both errors, no API call', (tester) async {
    await pumpLogin(tester, 200, {});
    await tester.tap(submit);
    await tester.pump();
    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    expect(calls, 0);
  });

  testWidgets('bad email: shows error, no API call', (tester) async {
    await pumpLogin(tester, 200, {});
    await tester.enterText(email, 'mai@duesoon');
    await tester.enterText(password, 'demo1234');
    await tester.tap(submit);
    await tester.pump();
    expect(find.text('Email is not valid'), findsOneWidget);
    expect(calls, 0);
  });

  testWidgets('wrong password (401): SnackBar, stays on Login', (tester) async {
    await pumpLogin(tester, 401, {'error': 'Invalid email or password'});
    await tester.enterText(email, 'mai@duesoon.test');
    await tester.enterText(password, 'wrong1');
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(calls, 1);
    expect(find.text('Invalid email or password'), findsOneWidget);
    expect(find.text('Welcome back'), findsOneWidget);
    expect(Session.isLoggedIn, isFalse);
  });

  testWidgets('success: session saved, Home tabs shown', (tester) async {
    await pumpLogin(tester, 200, {
      'token': 'tok123',
      'user': {'id': 1, 'name': 'Mai', 'email': 'mai@duesoon.test'},
    });
    await tester.enterText(email, 'mai@duesoon.test');
    await tester.enterText(password, 'demo1234');
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(Session.token, 'tok123');
    expect(find.text('This Week'), findsOneWidget);
    expect(find.text('Nothing due this week 🎉'), findsOneWidget);
  });
}

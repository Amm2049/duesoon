import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart'; // MockClient ships inside the http package

import 'package:duesoon/services/api_service.dart';
import 'package:duesoon/services/session.dart';

http.Response jsonResponse(Object body, int status) => http.Response(
      jsonEncode(body),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

const loginOk = {
  'token': 'tok123',
  'user': {'id': 1, 'name': 'Mai', 'email': 'mai@duesoon.test'},
};

void main() {
  setUp(Session.clear);

  test('login: sends JSON without a token, stores the session', () async {
    late http.Request sent;
    final api = ApiService(
      baseUrl: 'https://api.test',
      client: MockClient((req) async {
        sent = req;
        return jsonResponse(loginOk, 200);
      }),
    );

    final user = await api.login('  mai@duesoon.test ', 'demo1234');

    expect(sent.method, 'POST');
    expect(sent.url.toString(), 'https://api.test/login');
    expect(sent.headers['Content-Type'], startsWith('application/json'));
    expect(sent.headers.containsKey('Authorization'), isFalse);
    expect(jsonDecode(sent.body), {'email': 'mai@duesoon.test', 'password': 'demo1234'});
    expect(user.name, 'Mai');
    expect(Session.token, 'tok123');
    expect(Session.user?.id, 1);
  });

  test('me: sends the Bearer token', () async {
    Session.token = 'tok123';
    String? auth;
    final api = ApiService(
      client: MockClient((req) async {
        auth = req.headers['Authorization'];
        return jsonResponse({'user': {'id': 1, 'name': 'Mai'}}, 200);
      }),
    );
    final user = await api.me();
    expect(auth, 'Bearer tok123');
    expect(user.email, isNull);
  });

  test('401 → ApiException with the server message, session untouched', () async {
    final api = ApiService(
      client: MockClient((_) async => jsonResponse({'error': 'Invalid email or password'}, 401)),
    );
    await expectLater(
      api.login('mai@duesoon.test', 'wrong'),
      throwsA(isA<ApiException>()
          .having((e) => e.status, 'status', 401)
          .having((e) => e.message, 'message', 'Invalid email or password')),
    );
    expect(Session.isLoggedIn, isFalse);
  });

  test('409 on register', () async {
    final api = ApiService(
      client: MockClient((_) async => jsonResponse({'error': 'Email already registered'}, 409)),
    );
    await expectLater(
      api.register('Mai', 'mai@duesoon.test', 'demo1234'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 409)),
    );
  });

  test('non-JSON error page → generic message, keeps status', () async {
    final api = ApiService(
      client: MockClient((_) async => http.Response('<html>Bad gateway</html>', 502)),
    );
    await expectLater(
      api.me(),
      throwsA(isA<ApiException>()
          .having((e) => e.status, 'status', 502)
          .having((e) => e.message, 'message', ApiException.genericMessage)),
    );
  });

  test('no connection → status 0 (network)', () async {
    final api = ApiService(
      client: MockClient((_) async => throw http.ClientException('Failed host lookup')),
    );
    await expectLater(
      api.me(),
      throwsA(isA<ApiException>().having((e) => e.isNetwork, 'isNetwork', isTrue)),
    );
  });

  test('slow server → timeout → status 0', () async {
    final api = ApiService(
      timeout: const Duration(milliseconds: 20),
      client: MockClient((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 200));
        return jsonResponse(loginOk, 200);
      }),
    );
    await expectLater(
      api.login('mai@duesoon.test', 'demo1234'),
      throwsA(isA<ApiException>().having((e) => e.status, 'status', 0)),
    );
    expect(Session.isLoggedIn, isFalse);
  });

  test('unexpected reply shape → ApiException, not a crash', () async {
    final api = ApiService(
      client: MockClient((_) async => jsonResponse({'tasks': []}, 200)), // object, not a list
    );
    await expectLater(
      api.getTasks('week'),
      throwsA(isA<ApiException>().having((e) => e.isNetwork, 'isNetwork', isTrue)),
    );
    final api2 = ApiService(client: MockClient((_) async => jsonResponse({'user': null}, 200)));
    await expectLater(api2.me(), throwsA(isA<ApiException>()));
  });

  test('Thai text survives the round trip (UTF-8 decoding)', () async {
    final api = ApiService(
      client: MockClient((_) async => jsonResponse({'user': {'id': 2, 'name': 'มาย'}}, 200)),
    );
    expect((await api.me()).name, 'มาย');
  });
}

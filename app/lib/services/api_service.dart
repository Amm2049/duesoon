import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/course.dart';
import '../models/task.dart';
import '../models/user.dart';
import 'session.dart';

/// Any failed API call. [status] is the HTTP status, or 0 when the server
/// couldn't be reached (no internet, timeout, unreadable reply).
class ApiException implements Exception {
  final int status;
  final String message;

  const ApiException(this.status, this.message);

  static const genericMessage = 'Something went wrong. Pull to retry.';

  bool get isNetwork => status == 0;

  @override
  String toString() => 'ApiException($status, $message)';
}

/// All HTTP calls go through here (SPEC §8). Adds JSON + token headers and
/// turns `{ "error": "..." }` replies into [ApiException].
class ApiService {
  final http.Client _client;
  final String _base;
  final Duration _timeout;

  ApiService({http.Client? client, String? baseUrl, Duration? timeout})
      : _client = client ?? http.Client(),
        _base = baseUrl ?? apiBase,
        _timeout = timeout ?? const Duration(seconds: 10);

  // ---------- auth ----------

  /// Logs in and starts the [Session]. 401 → "Invalid email or password".
  Future<User> login(String email, String password) async {
    final data = await _send('POST', '/login', {
      'email': email.trim(),
      'password': password,
    });
    return _parse(() => _startSession(data));
  }

  /// Creates an account and starts the [Session]. 409 → email already registered.
  Future<User> register(String name, String email, String password) async {
    final data = await _send('POST', '/register', {
      'name': name.trim(),
      'email': email.trim(),
      'password': password,
    });
    return _parse(() => _startSession(data));
  }

  /// Who the current token belongs to.
  Future<User> me() async {
    final data = await _send('GET', '/me');
    return _parse(() => User.fromJson(data['user'] as Map<String, dynamic>));
  }

  // ---------- tasks ----------

  /// `GET /tasks?filter=week|all|done`, already sorted by the API (SPEC §4.3).
  Future<List<Task>> getTasks(String filter) async {
    final data = await _send('GET', '/tasks?filter=$filter');
    return _parse(() => [
          for (final j in data as List) Task.fromJson(j as Map<String, dynamic>),
        ]);
  }

  /// Marks a task done (POST) or not done (DELETE) for me. Idempotent on the server (D-16).
  /// Returns the new done count (D-20).
  Future<int> setDone(int taskId, bool done) async {
    final data = await _send(done ? 'POST' : 'DELETE', '/tasks/$taskId/done');
    return _parse(() => data['done_count'] as int);
  }

  /// `GET /tasks/:id` → TaskDetail (404 if it was deleted).
  Future<Task> getTask(int id) async {
    final data = await _send('GET', '/tasks/$id');
    return _parse(() => Task.fromJson(data as Map<String, dynamic>));
  }

  /// `POST /tasks` → the created TaskDetail (201).
  Future<Task> createTask(TaskInput input) async {
    final data = await _send('POST', '/tasks', input.toJson());
    return _parse(() => Task.fromJson(data as Map<String, dynamic>));
  }

  /// `PUT /tasks/:id` → updated TaskDetail. 403 if not mine, 404 if gone (D-15).
  Future<Task> updateTask(int id, TaskInput input) async {
    final data = await _send('PUT', '/tasks/$id', input.toJson());
    return _parse(() => Task.fromJson(data as Map<String, dynamic>));
  }

  /// `DELETE /tasks/:id` → 204. 403 if not mine, 404 if gone (D-15).
  Future<void> deleteTask(int id) async {
    await _send('DELETE', '/tasks/$id');
  }

  // ---------- courses ----------

  Future<List<Course>> getCourses() async {
    final data = await _send('GET', '/courses');
    return _parse(() => [
          for (final j in data as List) Course.fromJson(j as Map<String, dynamic>),
        ]);
  }

  User _startSession(dynamic data) {
    final user = User.fromJson(data['user'] as Map<String, dynamic>);
    Session.start(data['token'] as String, user);
    return user;
  }

  /// A reply with an unexpected shape (missing field, wrong type) becomes a normal
  /// [ApiException], so screens show "Something went wrong" instead of spinning forever.
  T _parse<T>(T Function() read) {
    try {
      return read();
    } on TypeError {
      throw const ApiException(0, ApiException.genericMessage);
    } on NoSuchMethodError {
      throw const ApiException(0, ApiException.genericMessage);
    }
  }

  // ---------- plumbing ----------

  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final request = http.Request(method, Uri.parse('$_base$path'));
    request.headers['Accept'] = 'application/json';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    final token = Session.token;
    if (token != null) request.headers['Authorization'] = 'Bearer $token';

    final http.Response response;
    try {
      final streamed = await _client.send(request).timeout(_timeout);
      response = await http.Response.fromStream(streamed).timeout(_timeout);
    } on TimeoutException {
      throw const ApiException(0, ApiException.genericMessage);
    } on http.ClientException {
      throw const ApiException(0, ApiException.genericMessage);
    }

    if (response.statusCode == 204) return null;

    dynamic data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      // Not JSON (e.g. a proxy error page).
      throw ApiException(response.statusCode, ApiException.genericMessage);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) return data;

    final message = (data is Map && data['error'] is String)
        ? data['error'] as String
        : ApiException.genericMessage;
    throw ApiException(response.statusCode, message);
  }
}

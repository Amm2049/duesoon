import 'dart:convert';

import 'dates.dart';

/// Form validators that mirror the API (api/src/lib/validate.js, SPEC §4.4).
/// The server is the rule; these only save a round trip and explain mistakes.
/// Each returns an error message, or null when the value is OK
/// (the shape `TextFormField.validator` expects).
class Validators {
  static final _emailRe = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static String? name(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return 'Name is required';
    if (v.length > 50) return 'Name must be at most 50 characters';
    return null;
  }

  static String? email(String? value) {
    final v = (value ?? '').trim().toLowerCase();
    if (v.isEmpty) return 'Email is required';
    if (v.length > 100 || !_emailRe.hasMatch(v)) return 'Email is not valid';
    return null;
  }

  /// Login only checks that something was typed (the server gives no length hints there).
  static String? loginPassword(String? value) {
    if ((value ?? '').isEmpty) return 'Password is required';
    return null;
  }

  /// Register: 6+ characters, at most 72 UTF-8 bytes (bcrypt's limit;
  /// a Thai character is 3 bytes). Not trimmed: spaces are allowed.
  static String? newPassword(String? value) {
    final v = value ?? '';
    if (v.length < 6) return 'Password must be at least 6 characters';
    if (utf8.encode(v).length > 72) return 'Password is too long';
    return null;
  }

  static String? confirmPassword(String? value, String password) {
    if ((value ?? '').isEmpty) return 'Please confirm your password';
    if (value != password) return 'Passwords do not match';
    return null;
  }

  // ---------- task form (validateTask in validate.js) ----------

  static String? title(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return 'Title is required';
    if (v.length > 100) return 'Title must be at most 100 characters';
    return null;
  }

  static String? description(String? value) {
    if ((value ?? '').trim().length > 1000) {
      return 'Description must be at most 1000 characters';
    }
    return null;
  }

  /// D-19: create → today…today+365; edit → any date up to today+365.
  /// [today] is `todayBangkok()`. "YYYY-MM-DD" strings compare correctly as strings.
  static String? dueDate(String? ymd, {required String today, required bool isCreate}) {
    if (ymd == null || ymd.isEmpty) return 'Pick a due date';
    if (isCreate && ymd.compareTo(today) < 0) return 'Due date cannot be in the past';
    if (ymd.compareTo(addDays(today, 365)) > 0) return 'Due date must be within one year';
    return null;
  }
}

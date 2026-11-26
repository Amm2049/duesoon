import '../models/user.dart';

/// Who is logged in. Kept in memory only, so every app start goes to Login (D-10).
class Session {
  static String? token;
  static User? user;

  static bool get isLoggedIn => token != null;

  static void start(String newToken, User newUser) {
    token = newToken;
    user = newUser;
  }

  static void clear() {
    token = null;
    user = null;
  }
}

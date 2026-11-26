import 'package:material_ui/material_ui.dart';

import '../screens/login_screen.dart';
import '../services/api_service.dart';
import '../services/session.dart';

/// Shared error handling for screens after login (SPEC §6 "Errors"):
/// 401 → token expired/invalid: clear Session, back to Login with a message.
/// Anything else → "Something went wrong. Pull to retry."
void showApiError(BuildContext context, Object error) {
  final messenger = ScaffoldMessenger.of(context);
  messenger.hideCurrentSnackBar();

  if (error is ApiException && error.status == 401) {
    Session.clear();
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
    messenger.showSnackBar(
      const SnackBar(content: Text('Session expired, please log in again')),
    );
    return;
  }

  messenger.showSnackBar(
    const SnackBar(content: Text(ApiException.genericMessage)),
  );
}

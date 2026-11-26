import 'package:material_ui/material_ui.dart';

import '../services/api_service.dart';
import '../utils/validators.dart';
import 'home_screen.dart';
import 'register_screen.dart';

/// S2: email + password → token in Session → Home.
class LoginScreen extends StatefulWidget {
  final ApiService? api; // tests pass a fake; the app uses the real one

  const LoginScreen({super.key, this.api});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  late final ApiService _api = widget.api ?? ApiService();
  bool _loading = false;
  bool _hidePassword = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _api.login(_email.text, _password.text);
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => HomeScreen(api: widget.api)),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      final message = switch (e.status) {
        401 => 'Invalid email or password',
        400 => e.message,
        _ => 'Something went wrong. Please try again.',
      };
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(Icons.event_available, size: 64, color: theme.colorScheme.primary),
                  const SizedBox(height: 16),
                  Text('Welcome back',
                      textAlign: TextAlign.center, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 24),
                  TextFormField(
                    key: const Key('login-email'),
                    controller: _email,
                    decoration: const InputDecoration(
                      labelText: 'Email',
                      prefixIcon: Icon(Icons.email_outlined),
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    textInputAction: TextInputAction.next,
                    validator: Validators.email,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    key: const Key('login-password'),
                    controller: _password,
                    obscureText: _hidePassword,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline),
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        tooltip: _hidePassword ? 'Show password' : 'Hide password',
                        icon: Icon(_hidePassword ? Icons.visibility : Icons.visibility_off),
                        onPressed: () => setState(() => _hidePassword = !_hidePassword),
                      ),
                    ),
                    autofillHints: const [AutofillHints.password],
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    validator: Validators.loginPassword,
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    key: const Key('login-submit'),
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(
                            height: 20, width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Log in'),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _loading
                        ? null
                        : () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => RegisterScreen(api: widget.api)),
                            ),
                    child: const Text("Don't have an account? Register"),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

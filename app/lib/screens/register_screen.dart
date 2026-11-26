import 'package:material_ui/material_ui.dart';

import '../services/api_service.dart';
import '../utils/validators.dart';
import 'home_screen.dart';

/// S3: name, email, password, confirm → logged in → Home.
class RegisterScreen extends StatefulWidget {
  final ApiService? api;

  const RegisterScreen({super.key, this.api});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  late final ApiService _api = widget.api ?? ApiService();
  bool _loading = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await _api.register(_name.text, _email.text, _password.text);
      if (!mounted) return;
      // Logged in: Home replaces the whole Login/Register stack.
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => HomeScreen(api: widget.api)),
        (_) => false,
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      final message = switch (e.status) {
        409 => 'Email already registered',
        400 => e.message,
        _ => 'Something went wrong. Please try again.',
      };
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(message)));
    }
  }

  InputDecoration _field(String label, IconData icon) => InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon),
        border: const OutlineInputBorder(),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  key: const Key('register-name'),
                  controller: _name,
                  decoration: _field('Name', Icons.person_outline),
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  validator: Validators.name,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('register-email'),
                  controller: _email,
                  decoration: _field('Email', Icons.email_outlined),
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  validator: Validators.email,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('register-password'),
                  controller: _password,
                  obscureText: true,
                  decoration: _field('Password (6+ characters)', Icons.lock_outline),
                  textInputAction: TextInputAction.next,
                  validator: Validators.newPassword,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  key: const Key('register-confirm'),
                  controller: _confirm,
                  obscureText: true,
                  decoration: _field('Confirm password', Icons.lock_outline),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  validator: (v) => Validators.confirmPassword(v, _password.text),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const Key('register-submit'),
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Create account'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

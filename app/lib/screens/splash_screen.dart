import 'package:material_ui/material_ui.dart';

import 'login_screen.dart';

/// S1: icon + name on the brand color for ~2 s, then Login (D-10: no saved login).
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  static const duration = Duration(seconds: 2);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(SplashScreen.duration, () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      backgroundColor: colors.primary,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_available, size: 96, color: colors.onPrimary),
            const SizedBox(height: 16),
            Text(
              'DueSoon',
              style: Theme.of(context)
                  .textTheme
                  .headlineLarge
                  ?.copyWith(color: colors.onPrimary, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}

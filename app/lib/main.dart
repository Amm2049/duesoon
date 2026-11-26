import 'package:material_ui/material_ui.dart'; // D-36 (not flutter/material.dart)

import 'screens/splash_screen.dart';

void main() {
  runApp(const DueSoonApp());
}

class DueSoonApp extends StatelessWidget {
  const DueSoonApp({super.key});

  @override
  Widget build(BuildContext context) {
    // SPEC §6.1 (D-32): Material 3, indigo seed, light + dark following the phone.
    return MaterialApp(
      title: 'DueSoon',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.dark,
        ),
      ),
      themeMode: ThemeMode.system,
      home: const SplashScreen(),
    );
  }
}

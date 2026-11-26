/// API base URL (D-43). Defaults to the live Vercel API (D-42).
/// Local API on the Android emulator:
///   flutter run --dart-define=API_BASE=http://10.0.2.2:3000
const String apiBase = String.fromEnvironment(
  'API_BASE',
  defaultValue: 'https://duesoon-api.vercel.app',
);

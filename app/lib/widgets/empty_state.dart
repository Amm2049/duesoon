import 'package:material_ui/material_ui.dart';

/// Centered 64 px icon + one line (§6.1 empty states).
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String text;

  const EmptyState({super.key, required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: colors.outline),
            const SizedBox(height: 16),
            Text(
              text,
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

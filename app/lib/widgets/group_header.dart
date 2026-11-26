import 'package:material_ui/material_ui.dart';

import '../utils/urgency.dart';

/// "OVERDUE", "TODAY", … above each day group, colored like its urgency (§6.1).
class GroupHeader extends StatelessWidget {
  final TaskGroup group;

  const GroupHeader({super.key, required this.group});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
      child: Text(
        group.label.toUpperCase(),
        style: theme.textTheme.labelLarge?.copyWith(
          color: urgencyColor(group.headerUrgency, theme.colorScheme),
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

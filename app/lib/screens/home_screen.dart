import 'package:material_ui/material_ui.dart';

import '../services/api_service.dart';
import '../services/session.dart';
import '../widgets/task_list_tab.dart';
import 'login_screen.dart';
import 'task_form_screen.dart';

/// S4 Home: This Week / All / Done tabs (SPEC §6). Each tab loads its own list.
/// + opens S6 (add); tapping a card opens S5 (handled in TaskListTab).
class HomeScreen extends StatefulWidget {
  final ApiService? api; // tests pass a fake

  const HomeScreen({super.key, this.api});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ApiService _api = widget.api ?? ApiService();
  int _version = 0; // bumping it rebuilds the tabs, so they reload

  void _logout() {
    Session.clear();
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => LoginScreen(api: widget.api)),
      (_) => false,
    );
  }

  Future<void> _addTask() async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TaskFormScreen(api: _api)),
    );
    if (saved == true && mounted) setState(() => _version++); // refresh rule (§6)
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('DueSoon'),
          actions: [
            IconButton(
              tooltip: 'Log out',
              icon: const Icon(Icons.logout),
              onPressed: _logout,
            ),
          ],
          bottom: const TabBar(
            tabs: [
              Tab(text: 'This Week'),
              Tab(text: 'All'),
              Tab(text: 'Done'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            for (final filter in const ['week', 'all', 'done'])
              TaskListTab(key: ValueKey('$filter-$_version'), filter: filter, api: _api),
          ],
        ),
        floatingActionButton: FloatingActionButton(
          key: const Key('add-task'),
          tooltip: 'Add task',
          onPressed: _addTask,
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}

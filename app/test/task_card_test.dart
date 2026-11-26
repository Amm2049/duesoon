import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';

import 'package:duesoon/models/task.dart';
import 'package:duesoon/widgets/task_card.dart';

void main() {
  // Regression: with ListTile, a 2-line title pushed the subtitle out of the card (seen on emulator).
  testWidgets('long title wraps and the subtitle stays inside the card', (tester) async {
    tester.view.physicalSize = const Size(360 * 3, 800 * 3); // narrow phone
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);

    const task = Task(
      id: 1, title: 'Lab 5: Forms & Validation with a much longer title', type: 'assignment',
      dueDate: '2026-11-24', courseId: 1, courseCode: 'CSC452',
      courseName: 'Mobile Programming', done: true, daysLeft: -2,
    );
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: ListView(children: [TaskCard(task: task, onToggleDone: (_) {})])),
    ));

    expect(tester.takeException(), isNull); // no overflow error
    final card = tester.getRect(find.byType(Card));
    final subtitle = tester.getRect(find.text('CSC452 · Due Tue 24 Nov'));
    expect(subtitle.bottom, lessThanOrEqualTo(card.bottom));
  });

  // Regression (Step 9 web check): screen readers announced the type chip as a checkbox.
  testWidgets('type chip is plain text for screen readers; only the done box is a checkbox',
      (tester) async {
    final handle = tester.ensureSemantics();
    const task = Task(
      id: 2, title: 'Quiz 2: Layouts', type: 'quiz', dueDate: '2026-11-25', courseId: 1,
      courseCode: 'CSC452', courseName: 'Mobile Programming', done: false, daysLeft: -1,
    );
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(body: ListView(children: [TaskCard(task: task, onToggleDone: (_) {})])),
    ));

    // matchesSemantics checks every flag: hasCheckedState defaults to false, so a checkbox fails.
    expect(tester.getSemantics(find.byType(TypeChip)), matchesSemantics(label: 'Quiz'));
    // The real checkbox keeps its label (merged into the tappable card's node).
    expect(find.semantics.byLabel(RegExp('Mark as done')), findsOne);
    handle.dispose();
  });
}

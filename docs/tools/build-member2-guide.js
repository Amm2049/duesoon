// Builds docs/member2-guide.html: Member 2's (Billy's) line-by-line guide to their code.
// Code is copied from the real source files by line range, so line numbers match the editor.
// No packages. Run from anywhere:  node docs/tools/build-member2-guide.js
// If a file gets shorter than a range below, the build stops with an error. If code moves
// within a file, update the line ranges in this script (the page doesn't detect that).
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "member2-guide.html");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fileCache = {};
const lines = (f) => (fileCache[f] ??= fs.readFileSync(path.join(ROOT, f), "utf8").replace(/\r/g, "").split("\n"));

// widget pill: kinds s=structure l=layout c=content i=interaction r=scroll h=helper
const KIND_NAME = { s: "Structure", l: "Layout", c: "Content", i: "Interaction", r: "Scrolling", h: "Helper" };
const w = (name, k) => `<span class="w k-${k}">${name}</span>`;

function codeBlock(file, from, to, opts = {}) {
  const all = lines(file);
  const slice = all.slice(from - 1, to);
  if (slice.length !== to - from + 1) throw new Error(`${file}:${from}-${to} out of range`);
  const indents = slice.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const cut = Math.min(...indents);
  const code = slice.map((l) => l.slice(cut)).join("\n");
  const nums = slice.map((_, i) => from + i).join("\n");
  const lang = opts.lang ?? (file.endsWith(".dart") ? "dart" : file.endsWith(".js") ? "javascript" : "plaintext");
  return `<div class="code"><div class="code-head"><span>${file}</span><span>lines ${from}–${to}</span></div><div class="code-scroll"><pre class="gutter" aria-hidden="true">${nums}</pre><pre class="src"><code class="language-${lang}">${esc(code)}</code></pre></div></div>`;
}

function chunk({ file, from, to, title, body, terms, lang }) {
  const t = terms?.length
    ? `<div class="terms"><div class="terms-label">Syntax in this part</div><dl>${terms
        .map(([a, b]) => `<dt><code>${a}</code></dt><dd>${b}</dd>`)
        .join("")}</dl></div>`
    : "";
  return `<article class="chunk"><h4>${title}</h4>${codeBlock(file, from, to, { lang })}<div class="note">${body}</div>${t}</article>`;
}

function fileSection({ id, file, role, intro, chunks, tree }) {
  return `<section class="file" id="${id}"><header class="file-head"><div class="eyebrow">${role}</div><h3><code>${file}</code></h3><p class="lead">${intro}</p></header>${
    tree ? `<div class="tree-box"><div class="terms-label">Widget tree (what build() returns)</div><pre class="tree">${tree}</pre></div>` : ""
  }${chunks.map((c) => chunk({ file, ...c })).join("")}</section>`;
}

// ------------------------------------------------------------------ content

const HOME = "app/lib/screens/home_screen.dart";
const TAB = "app/lib/widgets/task_list_tab.dart";
const GROUPED = "app/lib/widgets/grouped_task_list.dart";
const CARD = "app/lib/widgets/task_card.dart";
const HEADER = "app/lib/widgets/group_header.dart";
const EMPTY = "app/lib/widgets/empty_state.dart";
const URG = "app/lib/utils/urgency.dart";
const TASK = "app/lib/models/task.dart";
const COURSE = "app/lib/models/course.dart";
const USER = "app/lib/models/user.dart";
const API = "app/lib/services/api_service.dart";
const CONFIG = "app/lib/config.dart";
const ROUTES = "api/src/routes/tasks.js";
const REPO = "api/src/repos/tasks.js";
const DATES = "api/src/lib/dates.js";
const SCHEMA = "api/prisma/schema.prisma";

const flutterFiles = [
  {
    id: "home",
    file: HOME,
    role: "Screen · the page you see after logging in",
    intro: `The Home screen. It draws the top bar, the three tabs and the + button. It doesn't load any tasks itself: each tab is a ${w("TaskListTab", "s")} that loads its own list.`,
    tree: `${w("DefaultTabController", "h")}  <span class="tc">length: 3, links the tab bar to the pages</span>
└─ ${w("Scaffold", "s")}  <span class="tc">the basic page frame</span>
   ├─ appBar: ${w("AppBar", "s")}
   │  ├─ title:   ${w("Text", "c")}('DueSoon')
   │  ├─ actions: ${w("IconButton", "i")}  <span class="tc">log out</span>
   │  └─ bottom:  ${w("TabBar", "i")} → ${w("Tab", "i")} ×3  <span class="tc">This Week · All · Done</span>
   ├─ body: ${w("TabBarView", "r")}  <span class="tc">swipeable pages, same order as the tabs</span>
   │  └─ ${w("TaskListTab", "s")} ×3  <span class="tc">filter: week / all / done</span>
   └─ floatingActionButton: ${w("FloatingActionButton", "i")}  <span class="tc">the round + button</span>`,
    chunks: [
      {
        from: 11, to: 18,
        title: "The widget class: what you pass in",
        body: `<p>A screen in Flutter is a <strong>class</strong>. <code>HomeScreen</code> takes one optional input, <code>api</code>. The app doesn't pass one, so a real <code>ApiService</code> is created. Tests pass a fake one so they don't need the internet.</p>
<p>It extends <code>StatefulWidget</code> because something on it can change (the <code>_version</code> number below). A StatefulWidget always comes in <strong>two classes</strong>: this one holds the inputs and the <code>_HomeScreenState</code> class holds what changes.</p>`,
        terms: [
          ["extends StatefulWidget", "This widget has memory that can change. The memory lives in a separate State class."],
          ["final ApiService? api", "<code>final</code> = set once, never changed. <code>?</code> = may be <code>null</code> (empty)."],
          ["const HomeScreen({super.key, this.api})", "The constructor. <code>{ }</code> means named parameters: you call it as <code>HomeScreen(api: x)</code>. <code>super.key</code> passes the key up to Flutter."],
          ["@override", "\"I'm replacing a method my parent class already has.\""],
          ["createState() => _HomeScreenState()", "<code>=&gt;</code> is a one-line function: \"return this\". Flutter calls it once to create the memory object."],
        ],
      },
      {
        from: 20, to: 22,
        title: "The memory: the api and a version number",
        body: `<p><code>_api</code> is the object that makes HTTP calls. It's shared with all three tabs.</p>
<p><code>_version</code> is a trick. Every tab gets a key that includes this number. After you add a task, the number goes up, so every key changes. Flutter treats a widget with a new key as a <strong>brand-new widget</strong>, so all three tabs start over and reload their lists.</p>`,
        terms: [
          ["_api", "A name starting with <code>_</code> is private: only this file can use it."],
          ["late final", "<code>late</code> = work out the value the first time it's used, not earlier. Needed here because <code>widget</code> doesn't exist yet when the object is first made."],
          ["widget.api ?? ApiService()", "<code>??</code> = \"if the left side is null, use the right side\". So: the test's fake api, or a real one."],
          ["widget.api", "Inside a State class, <code>widget</code> means \"the widget object I belong to\", so you can read its inputs."],
        ],
      },
      {
        from: 24, to: 31,
        title: "Log out",
        body: `<p>It forgets the token (<code>Session.clear()</code>), then opens the Login screen and <strong>removes every screen behind it</strong>. That's what <code>(_) =&gt; false</code> means: \"remove all old screens\". Pressing Back after logging out then can't return to Home.</p>`,
        terms: [
          ["Navigator.pushAndRemoveUntil", "Open a new screen and remove old screens until the rule says stop. Here the rule never says stop, so all of them go."],
          ["MaterialPageRoute(builder: (_) => …)", "A route is a screen plus its slide animation. <code>builder</code> is a function that makes the screen."],
          ["(_) => false", "A small function with no name. <code>_</code> means \"I get an argument but don't need it\"."],
        ],
      },
      {
        from: 33, to: 39,
        title: "The + button: add a task, then refresh",
        body: `<p><code>Navigator.push</code> opens the form screen and <strong>waits</strong> (<code>await</code>) until the user comes back. The form returns <code>true</code> if it saved a task. Only then do we bump <code>_version</code>, so the tabs reload (see above).</p>
<p><code>mounted</code> checks that this screen still exists. While we waited, the user might have logged out.</p>`,
        terms: [
          ["Future&lt;void&gt; … async", "This function takes time (it waits for the user). <code>Future</code> = \"a value that arrives later\"."],
          ["await", "Pause here until the Future is finished, then continue with its value."],
          ["push&lt;bool&gt;", "The <code>&lt;bool&gt;</code> says: the screen will return a true/false when it closes."],
          ["setState(() => _version++)", "Change the memory <em>and</em> tell Flutter to redraw. Changing a variable without <code>setState</code> wouldn't update the screen."],
        ],
      },
      {
        from: 41, to: 77,
        title: "build(): the whole screen as nested widgets",
        body: `<p>Read it from the outside in, using the tree above. Every widget is a box. Its settings are written <code>name: value</code>, and what goes inside it is <code>child:</code> (one) or <code>children:</code> (a list).</p>
<p>${w("DefaultTabController", "h")} is invisible. It just links ${w("TabBar", "i")} (the tab buttons) and ${w("TabBarView", "r")} (the pages). Tap \"All\" and the view slides to page 2. <code>length: 3</code> must match the number of tabs and pages.</p>
<p>${w("Scaffold", "s")} is the standard page layout. It has named slots: <code>appBar</code> at the top, <code>body</code> in the middle, <code>floatingActionButton</code> bottom-right. You fill the slots and Scaffold places them.</p>
<p>Line 65 builds the three tabs with a <code>for</code> loop <em>inside the list</em>. It's the same as writing <code>TaskListTab</code> three times.</p>`,
        terms: [
          ["Widget build(BuildContext context)", "Flutter calls this whenever it needs to draw. It must return one widget (the top of the tree). <code>context</code> = \"where am I in the tree\"."],
          ["const Text('DueSoon')", "<code>const</code> = this never changes, so Flutter can reuse it instead of rebuilding it. A small speed win."],
          ["[ for (final f in …) Widget(f) ]", "Collection-for: builds list items with a loop, right inside <code>[ ]</code>."],
          ["ValueKey('$filter-$_version')", "A key gives a widget an identity, e.g. <code>'week-0'</code>. A different key means a different widget, so it starts fresh."],
          ["Key('add-task')", "A name that tests use to find and tap this button."],
          ["onPressed: _addTask", "Passes the function itself (no <code>()</code>). Flutter calls it later, on tap."],
        ],
      },
    ],
  },
  {
    id: "tab",
    file: TAB,
    role: "Widget · one tab's list",
    intro: `The most important file in your part. It <strong>loads</strong> one list from the API, keeps it in memory, and <strong>draws</strong> one of four things: a spinner, an error, an empty message, or the list.`,
    tree: `${w("RefreshIndicator", "i")}  <span class="tc">pull down → _load()</span>
└─ one of:
   ├─ ${w("Center", "l")} → ${w("CircularProgressIndicator", "c")}   <span class="tc">first load (returned early, no pull)</span>
   ├─ ${w("LayoutBuilder", "l")} → ${w("ListView", "r")} → ${w("SizedBox", "l")} → ${w("EmptyState", "c")}   <span class="tc">empty or failed</span>
   └─ ${w("ListView.builder", "r")}   <span class="tc">the real list</span>
      ├─ ${w("GroupHeader", "c")}   <span class="tc">for a HeaderRow</span>
      └─ ${w("TaskCard", "s")}      <span class="tc">for a TaskRow</span>`,
    chunks: [
      {
        from: 14, to: 22,
        title: "Inputs: which list, and the api",
        body: `<p>Home creates this three times with a different <code>filter</code>. The filter goes straight into the URL: <code>GET /tasks?filter=week</code>.</p>`,
        terms: [["required this.filter", "The caller <em>must</em> pass it. Forgetting it is an error before the app even runs."]],
      },
      {
        from: 24, to: 27,
        title: "The memory: three variables decide the whole screen",
        body: `<table class="mini"><tr><th>Variable</th><th>Meaning</th><th>Example</th></tr>
<tr><td><code>_tasks</code></td><td>The list from the server. <code>null</code> = not loaded yet.</td><td><code>null</code> → <code>[Lab 3, Quiz 2]</code></td></tr>
<tr><td><code>_failed</code></td><td>Did the last load fail?</td><td><code>true</code> with Wi-Fi off</td></tr>
<tr><td><code>_busy</code></td><td>Task ids with a done/undo request running.</td><td><code>{12}</code> while task 12 saves</td></tr></table>
<p><code>build()</code> just looks at these three and draws. To change the screen, change one of them inside <code>setState</code>.</p>`,
        terms: [
          ["List&lt;Task&gt;?", "A list of Task objects, or null. <code>&lt;Task&gt;</code> says what's inside the list."],
          ["final Set&lt;int&gt; _busy = {}", "A Set is a list without duplicates and with a fast <code>contains</code>. <code>final</code> means the variable always points to the same Set, but you can still add and remove items."],
        ],
      },
      {
        from: 29, to: 33,
        title: "initState: runs once, when the tab first appears",
        body: `<p>The place for \"do this when the widget is born\". Here it starts loading. <code>super.initState()</code> must come first, so Flutter can do its own setup.</p>
<p>It doesn't <code>await _load()</code> because <code>initState</code> can't be <code>async</code>. The load runs in the background and calls <code>setState</code> when it's done.</p>`,
      },
      {
        from: 35, to: 48,
        title: "_load(): ask the server, then remember the answer",
        body: `<p><strong>Success:</strong> save the tasks and clear the error flag, inside <code>setState</code>, so the list appears.<br><strong>Failure:</strong> set <code>_failed</code> and show a red snackbar message (<code>showApiError</code>).</p>
<p><code>if (!mounted) return;</code> appears twice. The request can take a few seconds, and meanwhile the user may have left this screen. Calling <code>setState</code> on a widget that's gone is an error, so we stop.</p>`,
        terms: [
          ["try { … } on ApiException catch (e) { … }", "Run the code. If it throws an <code>ApiException</code>, jump to the <code>on</code> block with the error in <code>e</code>."],
          ["mounted", "<code>true</code> while this widget is still on screen."],
          ["setState(() { a; b; })", "Several changes, one redraw."],
        ],
      },
      {
        from: 50, to: 62,
        title: "_toggleDone(): the checkbox was tapped",
        body: `<ol class="steps"><li>Already busy with this task? Ignore the tap. This stops a double tap from sending two requests.</li>
<li>Mark it busy, so the card shows a small spinner instead of the checkbox.</li>
<li>Tell the server, <strong>wait</strong>, then reload the list. The screen only changes after the server agrees (decision D-46).</li>
<li><code>finally</code> always runs, success or error, so the spinner always goes away.</li></ol>`,
        terms: [
          ["finally { … }", "Runs after <code>try</code>, whether it worked or threw an error. Used for cleanup."],
          ["if (mounted) showApiError(context, e)", "Show the error only if we're still on screen."],
        ],
      },
      {
        from: 64, to: 71,
        title: "_openDetail(): tap a card → detail screen → maybe reload",
        body: `<p>Same pattern as the + button on Home. Open the screen, wait for it to close, and reload only if it returns <code>true</code> (the task was edited, deleted or ticked there).</p>`,
        terms: [["changed == true", "Written this way because <code>changed</code> can be <code>true</code>, <code>false</code> or <code>null</code> (closed with Back). Only <code>true</code> counts."]],
      },
      {
        from: 73, to: 77,
        title: "_empty: the empty message for each tab",
        body: `<p>A getter that returns two values at once (an icon and a text), picked by the filter. On the Week tab you see 🎉 \"Nothing due this week\".</p>`,
        terms: [
          ["({IconData icon, String text})", "A <strong>record</strong>: a quick bundle of named values, without writing a class. Read it with <code>e.icon</code>, <code>e.text</code>."],
          ["get _empty =>", "A <strong>getter</strong>: used like a variable (<code>_empty</code>), but computed each time."],
          ["switch (x) { 'week' => …, _ => … }", "A switch <em>expression</em>: picks one value. <code>_</code> = \"anything else\" (the default)."],
        ],
      },
      {
        from: 79, to: 84,
        title: "build(), case 1: still loading",
        body: `<p>No tasks yet and no error means we're still waiting for the first answer, so show a centered spinner. <code>return</code> exits early, and the rest of <code>build</code> is skipped.</p>
<p><code>final tasks = _tasks;</code> copies the field into a local variable. Dart can then be sure it won't change halfway through, and lets us use it without <code>!</code> after the null check.</p>`,
      },
      {
        from: 86, to: 102,
        title: "build(), cases 2 and 3: failed, or empty",
        body: `<p>Both show an ${w("EmptyState", "c")} (icon + one line). <code>tasks == null</code> here can only mean \"failed\", so it shows the cloud-off icon.</p>
<p><strong>The tricky part:</strong> why put one message inside a ${w("ListView", "r")}? Pull-to-refresh only works on something that can scroll, and a plain centered message can't. So:</p>
<ul><li>${w("LayoutBuilder", "l")} tells us how tall the space is (<code>constraints.maxHeight</code>).</li>
<li>${w("SizedBox", "l")} makes the message exactly that tall, so it stays centered.</li>
<li><code>AlwaysScrollableScrollPhysics</code> lets the list be pulled even when there's nothing to scroll.</li></ul>`,
        terms: [
          ["final Widget body;", "Declared now, given a value later (in the <code>if</code> or the <code>else</code>). Dart checks that it gets a value exactly once."],
          ["cond ? a : b", "Short if/else that returns a value."],
          ["builder: (context, constraints) => …", "LayoutBuilder calls this function and passes the available size in <code>constraints</code>."],
        ],
      },
      {
        from: 103, to: 120,
        title: "build(), case 4: the real list",
        body: `<p>First turn the tasks into <strong>rows</strong>: headers + tasks for Week/All, tasks only for Done (see the next file).</p>
<p>${w("ListView.builder", "r")} builds rows <em>lazily</em>. It only calls <code>itemBuilder</code> for the rows on screen, so even 500 tasks stay fast. <code>itemCount</code> says how many rows there are; <code>i</code> is the row number.</p>
<p>The <code>switch</code> checks what kind of row it is. A header becomes a ${w("GroupHeader", "c")} and a task becomes a ${w("TaskCard", "s")}. The card gets <strong>functions</strong> (<code>onToggleDone</code>, <code>onTap</code>), so the card itself never talks to the API.</p>
<p><code>padding: bottom 88</code> leaves empty space at the end so the last card isn't hidden under the + button.</p>`,
        terms: [
          ["HeaderRow(:final group) =>", "A <strong>pattern</strong>: \"if this row is a HeaderRow, take its <code>group</code> field into a variable called <code>group</code>\"."],
          ["key: ValueKey(task.id)", "Ties each card to its task id, so Flutter doesn't mix up cards when the list changes."],
          ["(done) => _toggleDone(task, done)", "A small function made on the spot. The card calls it with true/false, and it adds the task."],
        ],
      },
      {
        from: 122, to: 122,
        title: "Wrap it all in pull-to-refresh",
        body: `<p>${w("RefreshIndicator", "i")} shows the spinning circle when you pull down, calls <code>_load</code>, and hides the circle when <code>_load</code>'s Future finishes. It needs a scrollable child, which is why every case above is a ListView.</p>`,
      },
    ],
  },
  {
    id: "grouped",
    file: GROUPED,
    role: "Helper · tasks → rows (not a widget)",
    intro: `No UI here, just plain Dart. It turns a list of tasks into a list of <strong>rows</strong> for the ListView: <code>[Header Overdue, Lab 3, Header Today, Essay, Quiz]</code>.`,
    chunks: [
      {
        from: 4, to: 16,
        title: "Two kinds of row",
        body: `<p>A row is either a <code>HeaderRow</code> (holds a group like Overdue) or a <code>TaskRow</code> (holds a task). Both are a kind of <code>ListRow</code>, so they fit in one list.</p>`,
        terms: [
          ["sealed class ListRow {}", "\"ListRow has only the subclasses in this file.\" Dart then knows a <code>switch</code> on it covers every case. Add a third kind and the switch in task_list_tab shows an error until you handle it."],
          ["class HeaderRow extends ListRow", "HeaderRow <em>is a</em> ListRow, plus its own field."],
          ["HeaderRow(this.group);", "Short constructor: \"put the argument straight into the <code>group</code> field\"."],
        ],
      },
      {
        from: 18, to: 32,
        title: "groupedRows(): sort tasks into buckets, then flatten",
        body: `<ol class="steps"><li>Make an empty bucket for each group: <code>{overdue: [], today: [], tomorrow: [], thisWeek: [], later: []}</code>.</li>
<li>Put each task into its bucket using <code>groupOf(daysLeft)</code>.</li>
<li>Walk the groups in order. For each <em>non-empty</em> group, add a header and then its tasks.</li></ol>
<p>The API already sorted the tasks by due date, so the order inside each bucket is right.</p>`,
        terms: [
          ["{for (final g in …) g: &lt;Task&gt;[]}", "A Map built with a loop: key <code>g</code>, value a new empty list of tasks."],
          ["byGroup[…]!", "<code>!</code> = \"I promise this isn't null\". Safe here because every group got a bucket."],
          ["if (…) ...[ a, b ]", "Collection-if + spread: only if the condition holds, add <em>all</em> the items of the inner list (<code>...</code> unpacks it)."],
        ],
      },
      {
        from: 34, to: 35,
        title: "flatRows(): the Done tab has no headers",
        body: `<p>Every task becomes a <code>TaskRow</code>, in the order the API sent (most recently finished first).</p>`,
      },
    ],
  },
  {
    id: "card",
    file: CARD,
    role: "Widget · one task in the list",
    intro: `What one task looks like: a colored strip on the left, the title, \"CSC452 · Due today\", a type chip and a checkbox. It's a <strong>StatelessWidget</strong>: it has no memory and just draws what it's given.`,
    tree: `${w("Card", "s")}  <span class="tc">rounded surface with margin</span>
└─ ${w("IntrinsicHeight", "l")}  <span class="tc">lets the strip be exactly as tall as the content</span>
   └─ ${w("Row", "l")}  <span class="tc">stretch: children fill the full height</span>
      ├─ ${w("Container", "l")}  <span class="tc">width 4, the urgency color strip</span>
      └─ ${w("Expanded", "l")}  <span class="tc">takes all remaining width</span>
         └─ ${w("InkWell", "i")}  <span class="tc">tap → detail screen, plus the ripple</span>
            └─ ${w("Padding", "l")}
               └─ ${w("Row", "l")}
                  ├─ ${w("Expanded", "l")}
                  │  └─ ${w("Column", "l")}
                  │     ├─ ${w("Text", "c")}  <span class="tc">title (max 2 lines, …)</span>
                  │     ├─ ${w("SizedBox", "l")}  <span class="tc">4px gap</span>
                  │     └─ ${w("Text", "c")}  <span class="tc">"CSC452 · Due today" in urgency color</span>
                  ├─ ${w("SizedBox", "l")}  <span class="tc">8px gap</span>
                  ├─ ${w("TypeChip", "c")}  <span class="tc">Quiz / Assignment / Exam</span>
                  └─ ${w("SizedBox", "l")} 48×48
                     └─ ${w("Checkbox", "i")}  <span class="tc">or a small spinner while busy</span>`,
    chunks: [
      {
        from: 9, to: 21,
        title: "Inputs: the task, busy, and two functions",
        body: `<p>The card gets <strong>functions</strong> instead of the API. When the checkbox is tapped, it calls <code>onToggleDone(true)</code> and the parent (TaskListTab) decides what to do. This is called <em>lifting state up</em>: the parent owns the data, children only show it and report taps.</p>
<p>It also makes the card easy to test: give it a fake task and check what it draws.</p>`,
        terms: [
          ["ValueChanged&lt;bool&gt;", "Flutter's name for \"a function that takes a bool and returns nothing\"."],
          ["VoidCallback?", "\"A function with no arguments that returns nothing\", or null (then tapping does nothing)."],
          ["this.busy = false", "Optional parameter with a default value."],
        ],
      },
      {
        from: 23, to: 28,
        title: "typeLabel(): 'quiz' → 'Quiz'",
        body: `<p>The API sends lowercase words, and the screen shows nice labels. Any unknown type is shown as it came.</p>`,
        terms: [["static", "Belongs to the class, not to one card. Called as <code>TaskCard.typeLabel('quiz')</code> (TypeChip below does that)."]],
      },
      {
        from: 30, to: 34,
        title: "Work out the color and the 'when' text first",
        body: `<p>Before drawing, prepare two values:</p>
<ul><li><code>color</code>: red / orange / green / grey from <code>days_left</code> (see urgency.dart).</li>
<li><code>when</code>: done tasks show the date (\"Due Sat 28 Nov\"); open tasks show \"2 days overdue\", \"Tomorrow\"…</li></ul>
<p><code>Theme.of(context)</code> gets the app's theme: its colors (<code>colorScheme</code>) and text styles (<code>textTheme</code>). Using it means dark mode just works.</p>`,
        terms: [
          ["'Due ${formatDue(task.dueDate)}'", "String interpolation: <code>${ … }</code> puts the result of code into the text. For a plain variable, <code>$name</code> is enough."],
        ],
      },
      {
        from: 36, to: 43,
        title: "The outer shape: card + color strip",
        body: `<p>${w("Card", "s")} gives the rounded, raised surface. <code>margin</code> is the space <em>outside</em> it (16 left/right, 4 top/bottom). <code>clipBehavior: Clip.antiAlias</code> cuts the strip to the card's rounded corners.</p>
<p>${w("Row", "l")} puts children <strong>side by side</strong>. <code>crossAxisAlignment: stretch</code> makes them all as tall as the row. That's how the 4px ${w("Container", "l")} becomes a full-height strip. A Row with stretch needs to know its height, and ${w("IntrinsicHeight", "l")} provides it by measuring the content first.</p>`,
        terms: [
          ["EdgeInsets.symmetric(horizontal: 16, vertical: 4)", "Spacing: same on left+right, same on top+bottom. Also: <code>.all(24)</code>, <code>.only(bottom: 88)</code>, <code>.fromLTRB(left, top, right, bottom)</code>."],
          ["Container(width: 4, color: color)", "The simplest box: a size and a fill color."],
        ],
      },
      {
        from: 44, to: 73,
        title: "The middle: title and subtitle",
        body: `<p>${w("Expanded", "l")} = \"take all the leftover width in this Row\". Without it, a long title would push the checkbox off the screen (yellow-black overflow stripes).</p>
<p>${w("InkWell", "i")} makes its child tappable and draws the ripple. ${w("Column", "l")} stacks children <strong>top to bottom</strong>: title, a 4px ${w("SizedBox", "l")} gap, subtitle.</p>
<p>The comment on line 44 records a real bug: ListTile has a fixed height and cut off the subtitle when the title wrapped to two lines.</p>`,
        terms: [
          ["Row vs Column", "Row = horizontal, Column = vertical. <em>Main axis</em> = the direction they line up in; <em>cross axis</em> = the other one."],
          ["crossAxisAlignment: start", "In a Column: line children up on the left."],
          ["mainAxisSize: MainAxisSize.min", "Column is only as tall as its children (by default it tries to be as tall as possible)."],
          ["maxLines: 2, overflow: ellipsis", "At most 2 lines, then \"…\"."],
          ["textTheme.titleMedium?.copyWith(…)", "Take the theme's style and change a few things. <code>?.</code> = only call it if the style isn't null."],
          ["cond ? TextDecoration.lineThrough : null", "Strike through done tasks. <code>null</code> means \"keep the default\"."],
        ],
      },
      {
        from: 74, to: 90,
        title: "The right side: chip, then checkbox or spinner",
        body: `<p>The checkbox sits in a fixed 48×48 ${w("SizedBox", "l")}. When <code>busy</code>, a small spinner takes its place, and the box size stays the same so nothing jumps.</p>
<p>${w("Checkbox", "i")} doesn't change itself. It shows <code>value: task.done</code>, and on tap calls <code>onChanged</code> with the new value. We pass that up, the server saves it, the list reloads, and the checkbox then shows the new value.</p>`,
        terms: [
          ["busy ? A : B", "Choose which widget to show."],
          ["v ?? false", "Checkbox gives a <code>bool?</code> (it can be null in a three-state mode). <code>?? false</code> turns null into false."],
          ["semanticLabel", "What a screen reader says for this checkbox."],
        ],
      },
      {
        from: 103, to: 126,
        title: "TypeChip: the small label",
        body: `<p>${w("Chip", "c")} draws the rounded label. In the list, <code>compact: true</code> makes it smaller (small text, tight padding).</p>
<p>${w("Semantics", "h")} is invisible. It controls what screen readers announce. Flutter's Chip announced itself as a checkbox, which is wrong, so <code>excludeSemantics</code> hides that and <code>label</code> says just \"Quiz\".</p>`,
        terms: [["compact ? X : null", "<code>null</code> means \"use Chip's normal value\"."]],
      },
    ],
  },
  {
    id: "header",
    file: HEADER,
    role: "Widget · \"OVERDUE\", \"TODAY\" …",
    intro: `The small colored label above each group. A ${w("Padding", "l")} around a ${w("Text", "c")}, nothing more.`,
    chunks: [
      {
        from: 6, to: 26,
        title: "Text in the group's urgency color",
        body: `<p>It takes the group's label (\"Overdue\"), makes it uppercase, and styles it: bold, a little letter spacing, colored by the group's urgency. So OVERDUE is red, TODAY and TOMORROW orange, THIS WEEK and LATER green.</p>
<p><code>fromLTRB(24, 16, 24, 8)</code>: more space above (16) than below (8), so the header sits closer to its own tasks.</p>`,
      },
    ],
  },
  {
    id: "empty",
    file: EMPTY,
    role: "Widget · big icon + one line",
    intro: `Used for the empty tabs and the \"couldn't load\" message.`,
    chunks: [
      {
        from: 4, to: 34,
        title: "Center → Padding → Column(icon, gap, text)",
        body: `<p>${w("Center", "l")} puts its child in the middle. The ${w("Column", "l")} uses <code>mainAxisSize: min</code>, so it's only as tall as icon + gap + text, and Center can then really center it.</p>
<p>Colors come from <code>colorScheme</code> (<code>outline</code>, <code>onSurfaceVariant</code>): soft greys that also work in dark mode. The project rule is to never hard-code colors here (D-32).</p>`,
      },
    ],
  },
];

const logicFiles = [
  {
    id: "urgency",
    file: URG,
    role: "Rules · colors, groups and labels",
    intro: `Turns <code>days_left</code> (a number from the API) into everything the user sees: which color, which group, which text. The app <strong>never computes days itself</strong>. The server does, using Bangkok time.`,
    chunks: [
      {
        from: 6, to: 14,
        title: "Urgency: four levels",
        body: `<table class="mini"><tr><th>days_left</th><th>Urgency</th><th>Color</th></tr>
<tr><td>any, but done</td><td>done</td><td><span class="dot" style="background:var(--muted)"></span> grey</td></tr>
<tr><td>&lt; 0</td><td>overdue</td><td><span class="dot" style="background:var(--red)"></span> red</td></tr>
<tr><td>0 – 2</td><td>soon</td><td><span class="dot" style="background:var(--orange)"></span> orange</td></tr>
<tr><td>3 or more</td><td>later</td><td><span class="dot" style="background:var(--green)"></span> green</td></tr></table>
<p>The order of the <code>if</code>s matters: \"done\" is checked first, so a done task is grey even if it's overdue.</p>`,
        terms: [["enum Urgency { overdue, soon, later, done }", "A fixed set of named values. Safer than strings like \"soon\" because typos become errors."]],
      },
      {
        from: 16, to: 26,
        title: "urgencyColor(): the only hard-coded colors in the app",
        body: `<p>Each urgency has a darker shade for light mode and a lighter shade for dark mode, so the text stays readable on both backgrounds.</p>`,
        terms: [["Colors.red.shade700", "Material's red palette: 50 (palest) … 900 (darkest)."]],
      },
      {
        from: 28, to: 49,
        title: "TaskGroup: the five groups, and which one a task goes in",
        body: `<p>An <strong>enhanced enum</strong>: each value carries extra data, a label to show and the urgency used to color its header. The order they're written in is the order on screen.</p>
<p><code>groupOf</code>: &lt;0 Overdue · 0 Today · 1 Tomorrow · 2–7 This week · &gt;7 Later.</p>`,
        terms: [["today('Today', Urgency.soon)", "Creates the enum value <code>today</code> by calling the enum's constructor (line 39) with these two values."]],
      },
      {
        from: 51, to: 65,
        title: "Label helpers",
        body: `<p><code>dueLabel</code> makes the subtitle text. <code>-daysLeft</code> flips the sign: −3 becomes \"3 days overdue\". <code>doneCountText</code> is used on the detail screen (\"3 classmates finished this\").</p>`,
      },
    ],
  },
  {
    id: "models",
    file: TASK,
    role: "Model · what a task looks like in Dart",
    intro: `The API sends JSON (a Map of strings). A model class turns it into a typed Dart object, so you can write <code>task.title</code> and get autocomplete and type checks.`,
    chunks: [
      {
        from: 30, to: 63,
        title: "The fields",
        body: `<p>The top group is in every task. The \"Detail only\" fields come only from <code>GET /tasks/:id</code>, so they're nullable (<code>?</code>) and stay null in the list.</p>
<p>Names are camelCase in Dart (<code>dueDate</code>) but snake_case in JSON (<code>due_date</code>). <code>dueDate</code> stays a <code>\"2026-11-28\"</code> string, so the phone's time zone can never shift the day.</p>`,
      },
      {
        from: 65, to: 82,
        title: "fromJson: JSON map → Task",
        body: `<p>A <strong>factory constructor</strong> that reads each key and checks its type. If the server ever sent a wrong type, <code>as int</code> throws, and ApiService turns that into a friendly error.</p>`,
        terms: [
          ["factory Task.fromJson(…)", "A named constructor that can run code before returning the object. Called as <code>Task.fromJson(map)</code>."],
          ["Map&lt;String, dynamic&gt;", "JSON object: string keys, values of any type."],
          ["json['id'] as int", "\"Treat this value as an int, and fail if it isn't one.\""],
          ["as String?", "Same, but null is allowed."],
        ],
      },
      {
        from: 1, to: 24,
        title: "TaskInput (used by the add/edit form, Member 3)",
        body: `<p>The opposite direction: Dart object → JSON for <code>POST</code>/<code>PUT</code>. <code>toJson()</code> also trims spaces off the title. It's in your <code>models/</code> folder, but the form screen uses it.</p>`,
      },
    ],
    extra: () =>
      chunk({ file: COURSE, from: 1, to: 16, title: "models/course.dart and models/user.dart", body: `<p>Same pattern, smaller. <code>User</code> is in the same shape: <code>id</code>, <code>name</code> and an optional <code>email</code> (the <code>/me</code> reply has no email).</p>` }),
  },
  {
    id: "api",
    file: API,
    role: "Service · every HTTP call goes through here",
    intro: `Screens never use <code>http</code> directly. They call <code>api.getTasks('week')</code> and get back a <code>List&lt;Task&gt;</code> or an <code>ApiException</code>. Your parts are <code>getTasks</code>, <code>setDone</code> and the plumbing they use.`,
    chunks: [
      {
        from: 12, to: 26,
        title: "ApiException: one error type for everything",
        body: `<p>Wrong password, server down, no internet: all become an <code>ApiException</code> with a status and a message ready to show. <code>status 0</code> means the server couldn't be reached.</p>`,
        terms: [
          ["implements Exception", "Marks it as something you can <code>throw</code> and <code>catch</code>."],
          ["bool get isNetwork => status == 0;", "A getter: <code>e.isNetwork</code> is true for network problems."],
        ],
      },
      {
        from: 30, to: 38,
        title: "Constructor with defaults",
        body: `<p>Everything is optional: the real app uses the real http client, the URL from config.dart and a 10-second timeout. Tests swap in a fake client.</p>`,
        terms: [[": _client = …, _base = …", "An <strong>initializer list</strong>: sets the final fields before the object exists."]],
      },
      {
        from: 69, to: 82,
        title: "getTasks() and setDone(): your two calls",
        body: `<p><code>getTasks</code>: <code>GET /tasks?filter=week</code> → a JSON list → each item through <code>Task.fromJson</code>.</p>
<p><code>setDone</code>: tick → <code>POST /tasks/12/done</code>; untick → <code>DELETE /tasks/12/done</code>. Same URL, and the HTTP method says which one.</p>`,
        terms: [
          ["done ? 'POST' : 'DELETE'", "Pick the HTTP method from the bool."],
          ["[for (final j in data as List) Task.fromJson(…)]", "Collection-for again: one Task per JSON item."],
        ],
      },
      {
        from: 122, to: 132,
        title: "_parse(): turn a weird reply into a normal error",
        body: `<p>If the JSON has the wrong shape, <code>fromJson</code> throws a TypeError. Without this, the screen would spin forever. With it, the user sees \"Something went wrong\".</p>`,
        terms: [["T _parse&lt;T&gt;(T Function() read)", "A <strong>generic</strong> function: works for any return type <code>T</code> (a Task, a List, an int). It takes a function, runs it, and catches errors."]],
      },
      {
        from: 136, to: 144,
        title: "_send(), part 1: build the request",
        body: `<p>Full URL = base + path. Headers say \"I accept JSON\", \"I'm sending JSON\" (only when there's a body), and <code>Authorization: Bearer &lt;token&gt;</code> when logged in. The server reads the user id from that token, never from the body.</p>`,
        terms: [["[Object? body]", "Square brackets = an optional <em>positional</em> parameter (GET has no body)."]],
      },
      {
        from: 146, to: 154,
        title: "_send(), part 2: send it, with a timeout",
        body: `<p>No answer in 10 seconds, or no connection at all? Throw <code>ApiException(0, …)</code>.</p>`,
      },
      {
        from: 156, to: 171,
        title: "_send(), part 3: read the reply",
        body: `<p>204 means no body, so return null. Otherwise decode the JSON. Status 2xx means success, so return the data. Anything else becomes an <code>ApiException</code> with the server's <code>error</code> message.</p>`,
        terms: [["utf8.decode(response.bodyBytes)", "Decode bytes as UTF-8, so Thai text and emoji come out right."]],
      },
    ],
  },
  {
    id: "config",
    file: CONFIG,
    role: "Setting · where the API is",
    intro: `One constant: the API's web address.`,
    chunks: [
      {
        from: 1, to: 7,
        title: "apiBase",
        body: `<p>By default the live Vercel API. <code>String.fromEnvironment</code> lets you change it at build time without editing code: <code>flutter run --dart-define=API_BASE=…</code>.</p>`,
      },
    ],
  },
];

const backendFiles = [
  {
    id: "routes",
    file: ROUTES,
    role: "Express routes · the URLs your screens call",
    intro: `Only your routes: the list and done/undo. Every route here runs <em>after</em> the token check, so <code>req.user.id</code> is always the logged-in student.`,
    chunks: [
      {
        from: 34, to: 41,
        title: "GET /tasks?filter=…",
        body: `<p>Read the filter (default <code>all</code>), reject anything unknown with 400, otherwise ask the repo for the list and send it as JSON.</p>`,
        terms: [
          ["router.get('/', async (req, res) => …)", "\"When a GET comes to this path, run this function.\" <code>req</code> = the request, <code>res</code> = the reply you build."],
          ["req.query.filter", "The <code>?filter=week</code> part of the URL."],
          ["res.status(400).json({ error })", "Reply with status 400 and a JSON body."],
        ],
      },
      {
        from: 88, to: 103,
        title: "POST and DELETE /tasks/:id/done",
        body: `<p>POST marks done, DELETE un-marks. Both are <strong>idempotent</strong>: doing it twice gives the same result as once, so a double tap or a retry can't break anything. Both reply with the new <code>done_count</code>.</p>`,
        terms: [["req.params.id", "The <code>:id</code> part of the path, e.g. <code>12</code> in <code>/tasks/12/done</code>."]],
      },
    ],
  },
  {
    id: "repo",
    file: REPO,
    role: "Database code (Prisma) · the queries",
    intro: `All database calls live in repos. Prisma writes the SQL for you: <code>findMany</code> = SELECT, <code>upsert</code> = INSERT … ON CONFLICT.`,
    chunks: [
      {
        from: 7, to: 20,
        title: "toTaskListItem(): database row → API JSON",
        body: `<p>Converts camelCase → snake_case, the Date → <code>\"YYYY-MM-DD\"</code>, and computes <code>days_left</code> from Bangkok \"today\". <code>done</code> is true if <em>this</em> student has a row in task_done.</p>`,
      },
      {
        from: 34, to: 57,
        title: "listTasks(): the three filters",
        body: `<table class="mini"><tr><th>filter</th><th>Which tasks</th></tr>
<tr><td>week</td><td>Not done by me, and due on or before today + 7 (so overdue ones too)</td></tr>
<tr><td>all</td><td>Every task</td></tr>
<tr><td>done</td><td>Done by me, most recently finished first</td></tr></table>
<p><code>include</code> = JOIN: bring the course, and <em>only my</em> done rows.</p>`,
        terms: [
          ["{ none: { userId: me } }", "\"No task_done row for me\" → NOT EXISTS in SQL."],
          ["orderBy: [{ dueDate: 'asc' }, { id: 'asc' }]", "ORDER BY due_date, id. The id breaks ties, so the order is always the same."],
        ],
      },
      {
        from: 113, to: 131,
        title: "markDone() / unmarkDone()",
        body: `<p><code>upsert</code>: insert the (user, task) row, or do nothing if it's already there, keeping the original time. Error <code>P2003</code> means the task doesn't exist, so the route answers 404.</p>`,
      },
    ],
  },
  {
    id: "dates",
    file: DATES,
    role: "Dates · Bangkok \"today\" and days_left",
    intro: `The reason the app never computes days: the server is the single source of \"today\", always in Bangkok time.`,
    chunks: [
      { from: 4, to: 10, title: "todayBangkok()", body: `<p>Bangkok is always UTC+7 (no daylight saving). Add 7 hours to the current UTC time and take the date part. At 01:00 in Bangkok it's still yesterday in UTC, and this gets it right.</p>` },
      { from: 35, to: 38, title: "daysBetween() = days_left", body: `<p>Both dates at UTC midnight, subtract, divide by one day. Due yesterday → −1, today → 0.</p>` },
    ],
  },
  {
    id: "schema",
    file: SCHEMA,
    role: "Tables · tasks and task_done",
    intro: `How \"done\" works per student: done-ness isn't a column on the task. It's a separate table with one row per (student, task).`,
    chunks: [
      {
        from: 38, to: 65,
        title: "Task and TaskDone",
        body: `<p><code>@@id([userId, taskId])</code>: the pair is the primary key, so a student can't mark the same task done twice. <code>onDelete: Cascade</code>: deleting a task deletes its done rows too. <code>@map(\"due_date\")</code>: called <code>dueDate</code> in code, <code>due_date</code> in the database.</p>`,
      },
    ],
  },
];

// ------------------------------------------------------------------ static sections

const syntaxRows = [
  ["final x = …", "Set once, never reassigned.", "<code>final tasks = _tasks;</code>"],
  ["const", "Fixed at compile time; Flutter can reuse it.", "<code>const Text('DueSoon')</code>"],
  ["Type?", "May be null (empty).", "<code>List&lt;Task&gt;? _tasks</code>"],
  ["x ?? y", "x, or y if x is null.", "<code>widget.api ?? ApiService()</code>"],
  ["x?.y", "Use y only if x isn't null.", "<code>titleMedium?.copyWith(…)</code>"],
  ["x!", "\"Trust me, x isn't null.\"", "<code>byGroup[g]!</code>"],
  ["_name", "Private to this file.", "<code>_load()</code>, <code>_busy</code>"],
  ["{required this.a, this.b = 1}", "Named parameters; required or with a default.", "<code>TaskCard(task: t, onToggleDone: f)</code>"],
  ["() => value", "One-line function: returns value.", "<code>(_) =&gt; false</code>"],
  ["async / await / Future", "Takes time; wait for it without freezing the app.", "<code>await widget.api.getTasks(…)</code>"],
  ["'Hi $name ${a.b}'", "Put values inside text.", "<code>'${task.courseCode} · $when'</code>"],
  ["cond ? a : b", "Short if/else that gives a value.", "<code>busy ? spinner : Checkbox(…)</code>"],
  ["switch (x) { a => 1, _ => 2 }", "Pick a value by matching; <code>_</code> = default.", "<code>typeLabel</code>, <code>_empty</code>"],
  ["[for (…) x]  [if (…) x]  ...list", "Build lists with loops and ifs; <code>...</code> unpacks a list.", "<code>groupedRows</code>"],
  ["(icon: x, text: y)", "Record: a quick bundle of named values.", "<code>_empty</code>"],
  ["Foo(:final bar)", "Pattern: \"if it's a Foo, take out bar\".", "<code>HeaderRow(:final group)</code>"],
  ["List&lt;Task&gt;  Map&lt;K, V&gt;", "Generic: says what's inside.", "<code>Future&lt;List&lt;Task&gt;&gt;</code>"],
];

const dictionary = [
  ["s", "Scaffold", "Page frame with slots: appBar, body, floatingActionButton.", "home"],
  ["s", "AppBar", "The top bar: title, action icons, optional bottom (our tabs).", "home"],
  ["s", "Card", "Rounded, slightly raised surface.", "card"],
  ["l", "Row / Column", "Children side by side / top to bottom.", "card"],
  ["l", "Expanded", "Inside a Row/Column: take all leftover space.", "card"],
  ["l", "Padding", "Empty space around one child.", "header"],
  ["l", "SizedBox", "A fixed size; empty, it's a gap. With a child, it forces a size.", "card"],
  ["l", "Center", "Puts its child in the middle.", "empty"],
  ["l", "Container", "A box with size, color, padding… We use it for the strip.", "card"],
  ["l", "IntrinsicHeight", "Measures the content first, so stretch children know the height.", "card"],
  ["l", "LayoutBuilder", "Tells you how much space you have (constraints).", "tab"],
  ["c", "Text", "Shows text; style, maxLines, overflow.", "card"],
  ["c", "Icon", "Shows an icon from <code>Icons.*</code>.", "empty"],
  ["c", "Chip", "Small rounded label.", "card"],
  ["c", "CircularProgressIndicator", "Spinning loading circle.", "tab"],
  ["i", "IconButton", "Tappable icon (our log-out).", "home"],
  ["i", "FloatingActionButton", "The round + button bottom-right.", "home"],
  ["i", "TabBar / Tab", "The tab buttons under the AppBar.", "home"],
  ["i", "InkWell", "Makes anything tappable, with a ripple.", "card"],
  ["i", "Checkbox", "Shows a bool; reports taps via onChanged.", "card"],
  ["i", "RefreshIndicator", "Pull down to run a function.", "tab"],
  ["r", "TabBarView", "Swipeable pages, one per tab.", "home"],
  ["r", "ListView", "Scrollable list of children.", "tab"],
  ["r", "ListView.builder", "Scrollable list that only builds visible rows.", "tab"],
  ["h", "DefaultTabController", "Invisible; links TabBar and TabBarView.", "home"],
  ["h", "Semantics", "Invisible; what screen readers say.", "card"],
  ["h", "Theme.of(context)", "The app's colors and text styles.", "card"],
  ["h", "Navigator + MaterialPageRoute", "Open (push) and close (pop) screens.", "home"],
];

const flowTick = [
  ["You tap the checkbox", "Checkbox calls <code>onChanged(true)</code> → the card calls <code>onToggleDone(true)</code>", "task_card.dart:88"],
  ["The tab takes over", "<code>_toggleDone</code> adds the id to <code>_busy</code> and calls setState, so the spinner appears", "task_list_tab.dart:51–53"],
  ["HTTP request", "<code>setDone</code> sends <code>POST /tasks/12/done</code> with the Bearer token", "api_service.dart:79–80"],
  ["Server route", "Gets the user from the token and calls <code>markDone(me, 12)</code>", "routes/tasks.js:89–93"],
  ["Database", "<code>upsert</code> adds a row to <code>task_done</code>", "repos/tasks.js:114–126"],
  ["Reply", "<code>{ \"done\": true, \"done_count\": 3 }</code>", ""],
  ["Reload", "<code>_load()</code> → <code>GET /tasks?filter=week</code>. The task is gone from This Week (week hides tasks I finished)", "task_list_tab.dart:56"],
  ["Redraw", "setState with the new list; <code>finally</code> removes the id from <code>_busy</code>", "task_list_tab.dart:59–61"],
];

const questions = [
  ["Why does <code>_load()</code> check <code>mounted</code> before <code>setState</code>?", "The request takes time. If the user left the screen meanwhile, the widget is gone, and calling setState on it is an error."],
  ["What does <code>_version</code> in HomeScreen do?", "It's part of each tab's key. Bumping it gives the tabs new keys, so Flutter rebuilds them from scratch and they reload."],
  ["Why is the empty message inside a ListView?", "RefreshIndicator only works with something scrollable. The ListView (always scrollable, full height) makes pull-to-refresh work on an empty or failed tab."],
  ["Why does TaskCard get functions instead of calling the API?", "The parent owns the data (lifting state up). The card only draws and reports taps, so it's simple and easy to test."],
  ["Where does <code>days_left</code> come from? Why not compute it in the app?", "From the server, using Bangkok \"today\". The phone's clock or time zone could be wrong, and the server is the rule."],
  ["What happens on a fast double tap of the checkbox?", "The second tap is ignored: <code>_busy</code> already contains the id. On the server the call is idempotent anyway."],
  ["Row vs Column vs Expanded?", "Row = horizontal, Column = vertical, Expanded = \"this child takes the leftover space\"."],
  ["StatelessWidget vs StatefulWidget in your files?", "Stateful: HomeScreen (_version), TaskListTab (_tasks, _failed, _busy). Stateless: TaskCard, GroupHeader, EmptyState, TypeChip. They just draw their inputs."],
];

// ------------------------------------------------------------------ page

const toc = [
  ["start", "Read Flutter in 5 ideas"],
  ["map", "The screen, labeled"],
  ["syntax", "Dart syntax cheat sheet"],
  ["dict", "Widget dictionary"],
  ["g-flutter", "Your Flutter files", flutterFiles],
  ["g-logic", "Rules, models, API calls", logicFiles],
  ["flow", "Flow: ticking a task"],
  ["g-backend", "Your backend files", backendFiles],
  ["quiz", "Check yourself"],
];

const tocHtml = toc
  .map(([id, label, files]) => `<li><a href="#${id}">${label}</a>${files ? `<ul>${files.map((f) => `<li><a href="#${f.id}">${path.basename(f.file)}</a></li>`).join("")}</ul>` : ""}</li>`)
  .join("");

const legend = Object.entries(KIND_NAME).map(([k, n]) => `<span class="w k-${k}">${n}</span>`).join(" ");

const html = `<title>DueSoon Member 2 Guide</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600&display=swap">
<style>
/* Layout: sticky contents rail on the left, one calm reading column (~74ch) on the right. */
:root{
  --bg:#f5f6f8; --surface:#ffffff; --fg:#1c2230; --muted:#5d6676; --line:#e1e5eb; --accent:#2b57c9;
  --code-bg:#f3f5f9; --code-fg:#283041; --gutter:#a3abba;
  --red:#d32f2f; --orange:#ef6c00; --green:#388e3c;
  --k-s:#7a4fc9; --k-l:#2b6fd6; --k-c:#1d8a6b; --k-i:#c25a00; --k-r:#b6336d; --k-h:#687183;
  --t-kw:#8a3fc2; --t-str:#1f7a4d; --t-com:#8a93a3; --t-num:#b4530d; --t-title:#2457c5; --t-type:#0f7c8c;
  --f-body:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;
  --f-head:"Space Grotesk","Inter",system-ui,sans-serif;
  --f-mono:"JetBrains Mono",ui-monospace,"Cascadia Code",Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#121519; --surface:#191d23; --fg:#e3e7ee; --muted:#9aa3b2; --line:#2a3039; --accent:#86a7ff;
  --code-bg:#161a20; --code-fg:#d5dbe5; --gutter:#5b6474;
  --red:#e57373; --orange:#ffb74d; --green:#81c784;
  --k-s:#b89bf0; --k-l:#7fb0ff; --k-c:#5fd0ac; --k-i:#ffab5c; --k-r:#f08ab5; --k-h:#a3abba;
  --t-kw:#c79bf2; --t-str:#8fd4a8; --t-com:#6e7787; --t-num:#f2a56b; --t-title:#8db4ff; --t-type:#6fd0dc;
  color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#121519; --surface:#191d23; --fg:#e3e7ee; --muted:#9aa3b2; --line:#2a3039; --accent:#86a7ff;
  --code-bg:#161a20; --code-fg:#d5dbe5; --gutter:#5b6474;
  --red:#e57373; --orange:#ffb74d; --green:#81c784;
  --k-s:#b89bf0; --k-l:#7fb0ff; --k-c:#5fd0ac; --k-i:#ffab5c; --k-r:#f08ab5; --k-h:#a3abba;
  --t-kw:#c79bf2; --t-str:#8fd4a8; --t-com:#6e7787; --t-num:#f2a56b; --t-title:#8db4ff; --t-type:#6fd0dc;
  color-scheme:dark}

*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:24px}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}}
body{background:var(--bg);color:var(--fg);font:16px/1.7 var(--f-body);
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0}
a{color:var(--accent);text-underline-offset:3px}
a:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
code{font-family:var(--f-mono);font-size:.86em;background:var(--code-bg);padding:.1em .35em;border-radius:4px;overflow-wrap:anywhere}
h1,h2,h3,h4{font-family:var(--f-head);line-height:1.25;text-wrap:balance;margin:0}
p{margin:0}

.wrap{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:240px minmax(0,1fr);gap:56px;padding-block:48px 96px}
@media (max-width:960px){.wrap{grid-template-columns:minmax(0,1fr);gap:32px;padding-block:28px 64px}}

nav.toc{position:sticky;top:calc(env(safe-area-inset-top,0px) + 24px);align-self:start;max-height:calc(100vh - 48px);overflow:auto;font-size:14px}
nav.toc ul{list-style:none;margin:0;padding:0}
nav.toc>ul>li{margin-bottom:10px}
nav.toc ul ul{margin:6px 0 0 2px;padding-left:12px;border-left:1px solid var(--line)}
nav.toc ul ul li{margin:3px 0}
nav.toc a{color:var(--muted);text-decoration:none}
nav.toc>ul>li>a{color:var(--fg);font-weight:500}
nav.toc a:hover{color:var(--accent)}
.toc-label{font:600 12px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
@media (max-width:960px){nav.toc{position:static;max-height:none;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 20px}}
.toc-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
.toc-head .toc-label{margin-bottom:0}
.toc-btn{font:500 13px var(--f-body);color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:4px 12px;cursor:pointer}
.toc-btn:hover{color:var(--accent);border-color:var(--accent)}
.toc-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.show-toc{position:fixed;z-index:5;top:calc(env(safe-area-inset-top,0px) + 16px);left:max(16px,env(safe-area-inset-left,0px));padding:7px 14px;box-shadow:0 2px 10px rgba(20,30,50,.12)}
body.toc-hidden nav.toc{display:none}
body.toc-hidden .wrap{grid-template-columns:minmax(0,1fr)}
body.toc-hidden main{margin:0 auto;width:100%}
@media (max-width:1300px){body.toc-hidden .wrap{padding-top:72px}}

main{min-width:0;max-width:780px}
.hero{padding-bottom:40px;border-bottom:1px solid var(--line);margin-bottom:56px}
.hero .eyebrow{margin-bottom:10px}
.hero h1{font-size:clamp(30px,4.4vw,42px);font-weight:600;letter-spacing:-.01em;margin-bottom:16px}
.hero p{color:var(--muted);max-width:62ch;font-size:17px}
.hero .how{margin-top:20px;display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;color:var(--muted)}
.eyebrow{font:600 12px var(--f-body);letter-spacing:.09em;text-transform:uppercase;color:var(--accent)}

section.block{margin-bottom:80px}
section.block>h2,.group-title{font-size:28px;font-weight:600;margin-bottom:8px}
.sub{color:var(--muted);margin-bottom:28px;max-width:64ch}
.group-title{margin-top:16px;padding-top:40px;border-top:1px solid var(--line)}

.ideas{display:grid;gap:14px}
.idea{display:grid;grid-template-columns:34px minmax(0,1fr);gap:14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.idea .n{font:600 15px var(--f-head);color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);width:30px;height:30px;border-radius:50%;display:grid;place-items:center}
.idea h3{font-size:17px;margin-bottom:4px}
.idea p{color:var(--muted)}
.idea p code{color:var(--fg)}
.read-call{margin-top:18px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px;overflow-x:auto}
.read-call pre{margin:0;font:14px/1.9 var(--f-mono);color:var(--code-fg)}
.read-call .a{color:var(--k-l);font-weight:500}.read-call .b{color:var(--t-num)}.read-call .c{color:var(--k-c);font-weight:500}
.read-call .lab{font:13px var(--f-body);color:var(--muted)}

/* phone mock */
.map{display:flex;flex-wrap:wrap;gap:32px;align-items:flex-start}
.phone{width:300px;max-width:100%;border:1px solid var(--line);border-radius:28px;background:var(--surface);padding:10px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 28px rgba(20,30,50,.08);flex-shrink:0}
.screen{border-radius:20px;overflow:hidden;background:var(--bg);position:relative;font-size:13px;line-height:1.35}
.appbar{background:var(--surface);padding:14px 14px 0;border-bottom:1px solid var(--line)}
.appbar .row{display:flex;justify-content:space-between;align-items:center;font:600 17px var(--f-head)}
.tabs{display:flex;margin-top:12px}
.tabs span{flex:1;text-align:center;padding:8px 0 9px;color:var(--muted);font-weight:500;font-size:12.5px}
.tabs span.on{color:var(--accent);box-shadow:inset 0 -2px 0 var(--accent)}
.gh{padding:12px 16px 6px;font:700 11px var(--f-body);letter-spacing:.1em}
.tcard{margin:0 10px 6px;background:var(--surface);border:1px solid var(--line);border-radius:10px;display:flex;overflow:hidden}
.tcard .strip{width:4px;flex-shrink:0}
.tcard .body{flex:1;padding:8px 6px 8px 12px;min-width:0}
.tcard .t{font-weight:600;font-size:13.5px}
.tcard .s{font-size:12px;margin-top:2px}
.tcard .chip{align-self:center;font-size:10.5px;border:1px solid var(--line);border-radius:8px;padding:2px 7px;color:var(--muted)}
.tcard .box{align-self:center;width:16px;height:16px;border:2px solid var(--muted);border-radius:3px;margin:0 12px 0 10px;flex-shrink:0}
.fab{position:absolute;right:14px;bottom:14px;width:46px;height:46px;border-radius:14px;background:color-mix(in srgb,var(--accent) 18%,var(--surface));color:var(--accent);display:grid;place-items:center;font-size:24px;font-weight:300}
.pin{display:inline-grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--fg);color:var(--bg);font:600 10.5px var(--f-body);vertical-align:middle;margin-left:4px;flex-shrink:0}
.legend{flex:1;min-width:260px;list-style:none;margin:0;padding:0;display:grid;gap:12px}
.legend li{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;align-items:start}
.legend li .pin{margin:3px 0 0}
.legend small{display:block;color:var(--muted);font-size:13.5px}

/* tables */
.tbl{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px}
table{border-collapse:collapse;width:100%;font-size:14.5px}
th,td{text-align:left;padding:11px 16px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font:600 12px var(--f-body);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:color-mix(in srgb,var(--line) 35%,transparent)}
td:first-child{white-space:nowrap}
table.mini{margin:4px 0 12px;font-size:14px;background:var(--surface);border:1px solid var(--line);border-radius:10px;border-collapse:separate;border-spacing:0;overflow:hidden}
table.mini th,table.mini td{padding:8px 12px}
table.mini td:first-child{white-space:nowrap}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:baseline}

/* widget pills */
.w{font:500 .84em var(--f-mono);padding:.12em .5em;border-radius:6px;white-space:nowrap;color:var(--k);background:color-mix(in srgb,var(--k) 12%,transparent)}
.k-s{--k:var(--k-s)}.k-l{--k:var(--k-l)}.k-c{--k:var(--k-c)}.k-i{--k:var(--k-i)}.k-r{--k:var(--k-r)}.k-h{--k:var(--k-h)}
.legend-line{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;font-size:14px}

.dict{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.dict div{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.dict .w{font-size:13.5px}
.dict p{margin-top:8px;font-size:14px;color:var(--muted);line-height:1.55}
.dict a{font-size:12.5px;display:inline-block;margin-top:6px}

/* files */
section.file{margin:56px 0 72px}
.file-head{margin-bottom:24px}
.file-head .eyebrow{margin-bottom:8px}
.file-head h3{font-size:21px;font-weight:600;margin-bottom:10px}
.file-head h3 code{background:none;padding:0;font-size:.92em}
.lead{color:var(--muted);max-width:66ch}
.tree-box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:16px 18px 18px;margin-bottom:36px;overflow-x:auto}
pre.tree{margin:8px 0 0;font:13.5px/2 var(--f-mono);color:var(--gutter)}
pre.tree .w{font-size:13px}
.tc{font-family:var(--f-body);font-size:12.5px;color:var(--muted);margin-left:6px}

.chunk{margin-bottom:44px}
.chunk h4{font-size:17px;font-weight:600;margin-bottom:12px}
.code{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--code-bg)}
.code-head{display:flex;justify-content:space-between;gap:12px;padding:7px 14px;font:12px var(--f-mono);color:var(--gutter);border-bottom:1px solid var(--line)}
.code-head span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.code-head span:last-child{white-space:nowrap}
.code-scroll{display:flex;overflow-x:auto}
.code pre{margin:0;padding:12px 0;font:13.5px/1.75 var(--f-mono)}
.gutter{color:var(--gutter);text-align:right;padding-left:14px!important;padding-right:12px!important;user-select:none;border-right:1px solid var(--line);flex-shrink:0}
.src{padding-left:16px!important;padding-right:20px!important;color:var(--code-fg);flex:1}
.src code{background:none;padding:0;font-size:inherit;overflow-wrap:normal}
.note{margin-top:16px;display:grid;gap:12px;max-width:70ch}
.note ul,.note ol{margin:0;padding-left:22px;display:grid;gap:6px}
.terms{margin-top:16px;border-left:3px solid color-mix(in srgb,var(--accent) 45%,transparent);padding:4px 0 4px 18px}
.terms-label{font:600 11.5px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:8px}
.terms dl{margin:0;display:grid;grid-template-columns:minmax(0,max-content) minmax(0,1fr);gap:9px 18px;font-size:14.5px;line-height:1.6}
.terms dt code{color:var(--fg)}
.terms dd{margin:0;color:var(--muted)}
.terms dd code{color:var(--fg)}
@media (max-width:640px){.terms dl{grid-template-columns:minmax(0,1fr);gap:2px}.terms dd{margin-bottom:10px}}

/* flow */
.flow{list-style:none;margin:0;padding:0;counter-reset:f;display:grid;gap:0}
.flow li{counter-increment:f;display:grid;grid-template-columns:36px minmax(0,1fr);gap:16px;position:relative;padding-bottom:22px}
.flow li::before{content:counter(f);width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:600 14px var(--f-head);background:var(--surface);border:1.5px solid var(--accent);color:var(--accent);position:relative;z-index:1}
.flow li:not(:last-child)::after{content:"";position:absolute;left:15px;top:30px;bottom:0;width:1.5px;background:var(--line)}
.flow b{display:block;font-weight:600}
.flow span{color:var(--muted);font-size:15px}
.flow .ref{display:inline-block;margin-top:2px;font:12.5px var(--f-mono);color:var(--gutter)}

details{background:var(--surface);border:1px solid var(--line);border-radius:10px;margin-bottom:10px}
summary{cursor:pointer;padding:14px 18px;font-weight:500;list-style:none;display:flex;gap:12px}
summary::-webkit-details-marker{display:none}
summary::before{content:"+";color:var(--accent);font:600 18px/1.3 var(--f-head);width:14px;flex-shrink:0}
details[open] summary::before{content:"−"}
details p{padding:0 18px 16px 44px;color:var(--muted)}

/* syntax colors (highlight.js classes) */
.hljs-keyword,.hljs-meta{color:var(--t-kw)}
.hljs-string,.hljs-regexp{color:var(--t-str)}
.hljs-comment{color:var(--t-com);font-style:italic}
.hljs-number,.hljs-literal{color:var(--t-num)}
.hljs-title,.hljs-title.function_{color:var(--t-title)}
.hljs-title.class_,.hljs-type,.hljs-built_in{color:var(--t-type)}
.hljs-subst{color:var(--code-fg)}
.hljs-attr,.hljs-variable,.hljs-params{color:var(--code-fg)}
</style>

<div class="wrap">
<button type="button" class="toc-btn show-toc" id="show-toc" aria-controls="toc" hidden>☰ Contents</button>
<nav class="toc" id="toc" aria-label="Contents"><div class="toc-head"><div class="toc-label">Contents</div><button type="button" class="toc-btn" id="hide-toc" aria-controls="toc">Hide</button></div><ul>${tocHtml}</ul></nav>
<main>

<header class="hero">
  <div class="eyebrow">DueSoon · Member 2 · Billy</div>
  <h1>Seeing tasks: your code, line by line</h1>
  <p>The Home screen, the three tabs, the task cards and the API calls behind them. The code below is copied from your files with real line numbers, so you can follow along in VS Code.</p>
  <div class="how"><span>1 · Read the 5 ideas</span><span>2 · Look at the labeled screen</span><span>3 · Go file by file</span></div>
</header>

<section class="block" id="start">
  <h2>Read Flutter in 5 ideas</h2>
  <p class="sub">Every widget file in your part follows these. Once they click, the files are mostly settings.</p>
  <div class="ideas">
    <div class="idea"><span class="n">1</span><div><h3>Everything on screen is a widget</h3><p>Text, padding, a row, a whole page: all widgets. Even spacing (<code>Padding</code>) and alignment (<code>Center</code>) are widgets that wrap other widgets.</p></div></div>
    <div class="idea"><span class="n">2</span><div><h3>Widgets nest like boxes in boxes</h3><p>One child goes in <code>child:</code>, several go in <code>children: [ ]</code>. The deep indentation in your files is just this nesting. Read it as a tree, from the outside in.</p></div></div>
    <div class="idea"><span class="n">3</span><div><h3><code>build()</code> returns the tree</h3><p>Flutter calls <code>build</code> whenever it needs to draw. It looks at the current data and returns widgets. It never \"changes\" the screen; it describes it again.</p></div></div>
    <div class="idea"><span class="n">4</span><div><h3>Stateless draws inputs; Stateful also has memory</h3><p><code>TaskCard</code> is Stateless: same task in, same card out. <code>TaskListTab</code> is Stateful: it remembers <code>_tasks</code>, and its memory lives in a second class (<code>_TaskListTabState</code>).</p></div></div>
    <div class="idea"><span class="n">5</span><div><h3><code>setState</code> = change memory, then redraw</h3><p>Change a variable inside <code>setState(() { … })</code> and Flutter calls <code>build</code> again with the new value. Without setState, the variable changes but the screen doesn't.</p></div></div>
  </div>
  <div class="read-call"><pre><span class="a">Padding</span>(                       <span class="lab">← widget name</span>
  <span class="b">padding:</span> EdgeInsets.all(24),   <span class="lab">← a setting, written name: value</span>
  <span class="c">child:</span> <span class="a">Text</span>('Hello'),         <span class="lab">← what goes inside</span>
)</pre></div>
</section>

<section class="block" id="map">
  <h2>The screen, labeled</h2>
  <p class="sub">The This Week tab, with each part linked to the file that draws it.</p>
  <div class="map">
    <div class="phone" aria-label="Mock of the Home screen"><div class="screen">
      <div class="appbar"><div class="row"><span>DueSoon <span class="pin">1</span></span><span style="font-size:15px;color:var(--muted)">⎋</span></div>
        <div class="tabs"><span class="on">This Week</span><span>All</span><span>Done</span></div></div>
      <div style="padding:2px 0 76px">
        <div class="gh" style="color:var(--red)">OVERDUE <span class="pin">3</span></div>
        <div class="tcard"><div class="strip" style="background:var(--red)"></div><div class="body"><div class="t">Lab 3 report</div><div class="s" style="color:var(--red)">CSC452 · 2 days overdue</div></div><span class="chip">Assignment</span><span class="box"></span></div>
        <div class="gh" style="color:var(--orange)">TODAY</div>
        <div class="tcard"><div class="strip" style="background:var(--orange)"></div><div class="body"><div class="t">Quiz 4 <span class="pin">4</span></div><div class="s" style="color:var(--orange)">CSC452 · Due today</div></div><span class="chip">Quiz</span><span class="box"></span></div>
        <div class="gh" style="color:var(--green)">THIS WEEK</div>
        <div class="tcard"><div class="strip" style="background:var(--green)"></div><div class="body"><div class="t">Essay draft</div><div class="s" style="color:var(--green)">ENG201 · In 5 days</div></div><span class="chip">Assignment</span><span class="box"></span></div>
        <div style="text-align:center;margin-top:10px"><span class="pin">2</span></div>
      </div>
      <div class="fab">+</div>
    </div></div>
    <ol class="legend">
      <li><span class="pin">1</span><div><a href="#home">home_screen.dart</a><small>AppBar with title + log out, the TabBar, the + button. Holds the 3 tabs.</small></div></li>
      <li><span class="pin">2</span><div><a href="#tab">task_list_tab.dart</a><small>The whole scrolling area of one tab: loading, pull-to-refresh, empty or error message.</small></div></li>
      <li><span class="pin">3</span><div><a href="#header">group_header.dart</a><small>\"OVERDUE\", \"TODAY\"… Which group and color come from <a href="#urgency">urgency.dart</a>; the order from <a href="#grouped">grouped_task_list.dart</a>.</small></div></li>
      <li><span class="pin">4</span><div><a href="#card">task_card.dart</a><small>One task: color strip, title, \"course · when\", type chip, checkbox.</small></div></li>
      <li><span class="pin" style="background:var(--muted)">·</span><div><a href="#api">api_service.dart</a> + <a href="#models">task.dart</a><small>Not visible: fetch the JSON and turn it into Task objects.</small></div></li>
    </ol>
  </div>
</section>

<section class="block" id="syntax">
  <h2>Dart syntax cheat sheet</h2>
  <p class="sub">Only the syntax that appears in your files, each with an example from your code.</p>
  <div class="tbl"><table><tr><th>Syntax</th><th>Means</th><th>In your code</th></tr>
  ${syntaxRows.map(([a, b, c]) => `<tr><td><code>${a}</code></td><td>${b}</td><td>${c}</td></tr>`).join("")}
  </table></div>
</section>

<section class="block" id="dict">
  <h2>Widget dictionary</h2>
  <p class="sub">Every Flutter widget in your part. The color shows what kind of job it does, and the same colors are used throughout this page.</p>
  <div class="legend-line">${legend}</div>
  <div class="dict">${dictionary.map(([k, n, d, at]) => `<div>${w(n, k)}<p>${d}</p><a href="#${at}">see it in use →</a></div>`).join("")}</div>
</section>

<h2 class="group-title" id="g-flutter">Your Flutter files</h2>
<p class="sub">From the outside in: the screen, then the tab inside it, then the pieces the tab draws.</p>
${flutterFiles.map(fileSection).join("")}

<h2 class="group-title" id="g-logic">Rules, models, API calls</h2>
<p class="sub">No widgets here. This is the logic and data the widgets use.</p>
${logicFiles.map((f) => fileSection(f) + (f.extra ? f.extra() : "")).join("")}

<section class="block" id="flow" style="margin-top:72px">
  <h2>Flow: ticking a task as done</h2>
  <p class="sub">One tap, from the checkbox to the database and back. A good thing to walk through in the demo.</p>
  <ol class="flow">${flowTick.map(([a, b, c]) => `<li><div><b>${a}</b><span>${b}</span>${c ? `<br><span class="ref">${c}</span>` : ""}</div></li>`).join("")}</ol>
</section>

<h2 class="group-title" id="g-backend">Your backend files</h2>
<p class="sub">The server side of the list and the checkbox. Shorter notes; the Flutter part is the focus.</p>
${backendFiles.map(fileSection).join("")}

<section class="block" id="quiz" style="margin-top:72px">
  <h2>Check yourself</h2>
  <p class="sub">Questions a teacher could ask in your demo. Try to answer before opening.</p>
  ${questions.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}
</section>

</main></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/dart.min.js"></script>
<script>
  (function () {
    var KEY = 'm2guide-toc-hidden';
    var showBtn = document.getElementById('show-toc');
    function setHidden(h, save) {
      document.body.classList.toggle('toc-hidden', h);
      showBtn.hidden = !h;
      if (save) { try { localStorage.setItem(KEY, h ? '1' : '0'); } catch (e) {} }
    }
    var saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (e) {}
    setHidden(saved, false);
    document.getElementById('hide-toc').addEventListener('click', function () { setHidden(true, true); showBtn.focus(); });
    showBtn.addEventListener('click', function () { setHidden(false, true); document.getElementById('hide-toc').focus(); });
  })();
  if (window.hljs) {
    hljs.configure({ ignoreUnescapedHTML: true });
    document.querySelectorAll('pre.src code:not(.language-plaintext)').forEach(function (el) { hljs.highlightElement(el); });
  }
</script>
`;

fs.writeFileSync(OUT, html);
console.log("wrote", OUT, (html.length / 1024).toFixed(0) + " KB");

// Builds docs/code-guide.html: a self-contained guide to the whole codebase, with a
// member filter, every source file's code, and step-by-step flows that link to exact lines.
// No packages. Run from anywhere:  node docs/tools/build-code-guide.js
// Line links are found by searching the real files, so if code changes and a reference
// no longer matches, the build stops with an error instead of pointing at a wrong line.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "docs", "code-guide.html");

// ---------------------------------------------------------------- members
const MEMBERS = {
  1: { name: "Member 1", part: "Getting in", short: "Accounts", desc: "App: Splash, Login, Register, Logout, session, form checks. Server: /register, /login, /me, the token check (middleware), JWT, password hashing, users table." },
  2: { name: "Member 2", part: "Seeing tasks", short: "Lists", desc: "App: Home tabs, task cards, done checkbox, loading data with http. Server: GET /tasks, POST/DELETE /tasks/:id/done, the list query, Bangkok \"today\" and days_left, the database tables." },
  3: { name: "Member 3", part: "Managing tasks", short: "CRUD", desc: "App: task detail, add / edit form, delete. Server: GET/POST/PUT/DELETE /tasks/:id, the owner check (404 then 403), task validation, /courses." },
  s: { name: "Shared", part: "Setup", short: "Shared", desc: "index.js (the Express app), db.js (database connection), dev.js, seed, Flutter/Android config. Everyone should know index.js; Member 2 can explain the rest in a minute." },
};

// ---------------------------------------------------------------- files
// owners: who should study it (first = main owner). keys: {find, note} → line links.
const FILES = [
  // ===== Member 1
  { path: "app/lib/main.dart", owners: [1], what: "The app's starting point. <code>main()</code> calls <code>runApp</code> with <code>DueSoonApp</code>, which sets up <code>MaterialApp</code>: the title, the indigo theme in light <em>and</em> dark mode (follows the phone), and the first screen (Splash).",
    keys: [
      { find: "void main()", note: "Program entry: <code>runApp(const DueSoonApp())</code>" },
      { find: "return MaterialApp(", note: "<code>MaterialApp</code>: app title, themes, first screen" },
      { find: "colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)", note: "Light theme: all colors generated from one seed color" },
      { find: "brightness: Brightness.dark", note: "Dark theme, same seed" },
      { find: "themeMode: ThemeMode.system", note: "Follow the phone's light/dark setting" },
      { find: "home: const SplashScreen()", note: "First screen shown" },
    ] },
  { path: "app/lib/screens/splash_screen.dart", owners: [1], what: "<b>Screen S1.</b> Shows the icon and \"DueSoon\" on the brand color for 2 seconds, then replaces itself with the Login screen.",
    keys: [
      { find: "class SplashScreen extends StatefulWidget", note: "StatefulWidget because it starts a timer when it appears" },
      { find: "void initState()", note: "<code>initState</code> runs once when the screen is created" },
      { find: "Future.delayed(SplashScreen.duration", note: "Wait 2 seconds" },
      { find: "if (!mounted) return;", note: "Safety: the screen might be gone by then" },
      { find: "Navigator.pushReplacement(", note: "<code>pushReplacement</code>: Back button can't return to the splash" },
      { find: "backgroundColor: colors.primary", note: "Colors come from the theme, not hard-coded" },
    ] },
  { path: "app/lib/screens/login_screen.dart", owners: [1], what: "<b>Screen S2.</b> Email + password form. On \"Log in\" it validates the fields, calls the API, stores the token and goes to Home. Wrong password or no internet → a SnackBar message.",
    keys: [
      { find: "final _formKey = GlobalKey<FormState>();", note: "Key to reach the <code>Form</code> and call <code>validate()</code>" },
      { find: "final _email = TextEditingController();", note: "Controllers hold what the user typed" },
      { find: "void dispose()", note: "Controllers are disposed when the screen closes" },
      { find: "Future<void> _submit() async", note: "<b>What \"Log in\" does</b>" },
      { find: "if (_loading || !_formKey.currentState!.validate()) return;", note: "Runs every field's <code>validator</code>; stops if any fails" },
      { find: "setState(() => _loading = true);", note: "<code>setState</code> → rebuild with a spinner in the button" },
      { find: "await _api.login(_email.text, _password.text);", note: "Calls the API (see <code>api_service.dart</code>)" },
      { find: "Navigator.pushReplacement(", note: "Go to Home; Back won't return to Login" },
      { find: "final message = switch (e.status) {", note: "Pick the error text by HTTP status (401 = wrong login)" },
      { find: "..showSnackBar(SnackBar(content: Text(message)));", note: "Show the message at the bottom" },
      { find: "validator: Validators.email,", note: "Field check from <code>validators.dart</code>" },
      { find: "obscureText: _hidePassword,", note: "Hide/show password (eye button toggles it with setState)" },
      { find: "MaterialPageRoute(builder: (_) => RegisterScreen(api: widget.api)),", note: "<code>Navigator.push</code> to Register (Back returns here)" },
    ] },
  { path: "app/lib/screens/register_screen.dart", owners: [1], what: "<b>Screen S3.</b> Name, email, password and confirm password. Creating the account also logs you in, then Home replaces the whole Login/Register history.",
    keys: [
      { find: "Future<void> _submit() async", note: "<b>What \"Create account\" does</b>" },
      { find: "await _api.register(_name.text, _email.text, _password.text);", note: "POST /register" },
      { find: "Navigator.pushAndRemoveUntil(", note: "<code>pushAndRemoveUntil(..., (_) =&gt; false)</code>: clear all previous screens" },
      { find: "409 => 'Email already registered',", note: "409 = this email already has an account" },
      { find: "InputDecoration _field(String label, IconData icon)", note: "Small helper so all fields look the same" },
      { find: "validator: Validators.newPassword,", note: "6+ characters" },
      { find: "validator: (v) => Validators.confirmPassword(v, _password.text),", note: "Must match the password field" },
    ] },
  { path: "app/lib/utils/validators.dart", owners: [1, 3], what: "All form checks in one place. Each function returns an <b>error message</b>, or <code>null</code> when the value is OK, which is exactly what <code>TextFormField(validator: ...)</code> expects. The same rules are checked again on the server (the server is the real rule).",
    keys: [
      { find: "static String? name(String? value)", note: "Name: required, max 50" },
      { find: "static String? email(String? value)", note: "Email: required, simple pattern check" },
      { find: "static String? loginPassword(String? value)", note: "Login: just not empty" },
      { find: "static String? newPassword(String? value)", note: "Register: 6+ characters (and not too long)" },
      { find: "static String? confirmPassword(String? value, String password)", note: "Confirm must equal password" },
      { find: "static String? title(String? value)", note: "<b>Member 3</b>: task title 1–100" },
      { find: "static String? dueDate(String? ymd, {required String today, required bool isCreate})", note: "<b>Member 3</b>: new tasks can't be in the past, max 1 year ahead" },
    ] },
  { path: "app/lib/services/session.dart", owners: [1], what: "Remembers who is logged in, <b>in memory only</b>: closing the app forgets it, so every start goes to Login. <code>static</code> fields mean there is one shared copy for the whole app.",
    keys: [
      { find: "static String? token;", note: "The login token sent with every request" },
      { find: "static void start(String newToken, User newUser)", note: "Called after login/register" },
      { find: "static void clear()", note: "Called on logout or when the token expires" },
    ] },
  { path: "app/lib/utils/api_errors.dart", owners: [1, 2, 3], what: "One function every screen uses after login when an API call fails. <b>401</b> (token expired/invalid) → forget the session and go back to Login. Anything else → \"Something went wrong. Pull to retry.\"",
    keys: [
      { find: "void showApiError(BuildContext context, Object error)", note: "Shared error handler" },
      { find: "if (error is ApiException && error.status == 401) {", note: "Session expired → back to Login" },
      { find: "Navigator.of(context).pushAndRemoveUntil(", note: "Clear all screens, show Login" },
    ] },

  // ===== Member 2
  { path: "app/lib/screens/home_screen.dart", owners: [2], what: "<b>Screen S4.</b> The main screen: app bar with Logout, three tabs (This Week / All / Done) and the + button. Each tab is a <code>TaskListTab</code> that loads its own list.",
    keys: [
      { find: "int _version = 0;", note: "Changing this number forces the tabs to reload" },
      { find: "void _logout()", note: "Logout: clear session, back to Login" },
      { find: "Future<void> _addTask() async", note: "+ button: open the form and <b>wait</b> for its result" },
      { find: "if (saved == true && mounted) setState(() => _version++);", note: "Form returned <code>true</code> → reload the lists" },
      { find: "return DefaultTabController(", note: "<code>DefaultTabController</code> connects TabBar and TabBarView" },
      { find: "bottom: const TabBar(", note: "The three tab titles" },
      { find: "body: TabBarView(", note: "One page per tab" },
      { find: "TaskListTab(key: ValueKey('$filter-$_version'), filter: filter, api: _api),", note: "Same widget, different <code>filter</code>: week / all / done" },
      { find: "floatingActionButton: FloatingActionButton(", note: "The + button" },
    ] },
  { path: "app/lib/widgets/task_list_tab.dart", owners: [2], what: "One tab's list. Loads tasks from the API when it appears, then shows a spinner, an empty message, an error message, or the grouped list. Pull down to refresh. Handles the done checkbox and opening a task.",
    keys: [
      { find: "List<Task>? _tasks; // null until the first load succeeds", note: "State: <code>null</code> means still loading" },
      { find: "void initState()", note: "Load as soon as the tab is created" },
      { find: "Future<void> _load() async", note: "<b>Load the list</b> from the API" },
      { find: "final tasks = await widget.api.getTasks(widget.filter);", note: "GET /tasks?filter=..." },
      { find: "setState(() {", note: "Store the tasks → screen rebuilds with them" },
      { find: "Future<void> _toggleDone(Task task, bool done) async", note: "<b>Checkbox:</b> wait for the server, then reload" },
      { find: "if (_busy.contains(task.id)) return; // ignore double taps", note: "Ignore double taps while saving" },
      { find: "Future<void> _openDetail(Task task) async", note: "Card tap → open detail, reload if something changed" },
      { find: "({IconData icon, String text}) get _empty", note: "Empty-list message per tab" },
      { find: "return const Center(child: CircularProgressIndicator());", note: "Loading spinner" },
      { find: "body = ListView.builder(", note: "<code>ListView.builder</code>: builds rows only as they scroll into view" },
      { find: "HeaderRow(:final group) => GroupHeader(group: group),", note: "A row is either a header…" },
      { find: "TaskRow(:final task) => TaskCard(", note: "…or a task card" },
      { find: "return RefreshIndicator(onRefresh: _load, child: body);", note: "Pull to refresh = run <code>_load</code> again" },
    ] },
  { path: "app/lib/widgets/task_card.dart", owners: [2, 3], what: "One task in the list: a colored urgency strip, the title (struck through when done), \"CSC452 · In 2 days\" in the urgency color, the type label, and the done checkbox. Also has <code>TypeChip</code>, the \"Quiz/Assignment/Exam\" label used here and in the detail screen.",
    keys: [
      { find: "static String typeLabel(String type) => switch (type) {", note: "\"quiz\" → \"Quiz\"" },
      { find: "final color = urgencyColor(urgencyOf(task.daysLeft, task.done), theme.colorScheme);", note: "Color from <code>days_left</code> (red / orange / green / grey)" },
      { find: "return Card(", note: "Material card" },
      { find: "Container(width: 4, color: color),", note: "The 4 px colored strip on the left" },
      { find: "// Not a ListTile: its fixed height clipped the subtitle when a title wrapped.", note: "Why a custom Row instead of <code>ListTile</code>" },
      { find: "onTap: onTap,", note: "Tap the card → open detail (callback from the tab)" },
      { find: "decoration: task.done ? TextDecoration.lineThrough : null,", note: "Done → strike-through" },
      { find: ": Checkbox(", note: "The done checkbox (a spinner while saving)" },
      { find: "class TypeChip extends StatelessWidget", note: "Type label; read as plain text by screen readers" },
    ] },
  { path: "app/lib/widgets/grouped_task_list.dart", owners: [2], what: "Turns the API's sorted task list into rows for one <code>ListView</code>: a header (\"OVERDUE\", \"TODAY\"…) followed by that group's tasks. The Done tab uses a flat list with no headers.",
    keys: [
      { find: "sealed class ListRow {}", note: "A row is a header or a task (Dart <code>sealed class</code>)" },
      { find: "List<ListRow> groupedRows(List<Task> tasks)", note: "Group tasks by day: Overdue, Today, Tomorrow, This week, Later" },
      { find: "List<ListRow> flatRows(List<Task> tasks)", note: "Done tab: no headers" },
    ] },
  { path: "app/lib/widgets/group_header.dart", owners: [2], what: "The colored group title above each day group (\"OVERDUE\" in red, \"TODAY\" in orange…).",
    keys: [{ find: "group.label.toUpperCase(),", note: "Label in capitals, colored by urgency" }] },
  { path: "app/lib/widgets/empty_state.dart", owners: [2], what: "Big icon + one line of text, used when a list is empty or failed to load.",
    keys: [{ find: "class EmptyState extends StatelessWidget", note: "A simple reusable StatelessWidget" }] },
  { path: "app/lib/utils/urgency.dart", owners: [2, 3], what: "All rules based on <code>days_left</code> (which the API sends; the app never calculates days): urgency colors, day groups, and texts like \"1 day overdue\" or \"3 classmates finished this\".",
    keys: [
      { find: "Urgency urgencyOf(int daysLeft, bool done)", note: "&lt;0 overdue · 0–2 soon · 3+ later · done" },
      { find: "Color urgencyColor(Urgency urgency, ColorScheme colors)", note: "The only hard-coded colors, light + dark versions" },
      { find: "enum TaskGroup {", note: "Day groups with their label and color (enhanced enum)" },
      { find: "TaskGroup groupOf(int daysLeft)", note: "Which group a task goes in" },
      { find: "String doneCountText(int count) => switch (count) {", note: "<b>Member 3</b> uses it in detail" },
      { find: "String dueLabel(int daysLeft)", note: "\"Due today\", \"Tomorrow\", \"In 5 days\"…" },
    ] },
  { path: "app/lib/models/task.dart", owners: [2, 3], what: "The <code>Task</code> class and how JSON from the API becomes a Task (<code>fromJson</code>). <code>TaskInput</code> is the opposite direction: form data → JSON for create/edit (Member 3).",
    keys: [
      { find: "class TaskInput {", note: "<b>Member 3</b>: what the form sends" },
      { find: "Map<String, dynamic> toJson() => {", note: "Dart → JSON (snake_case keys like <code>due_date</code>)" },
      { find: "class Task {", note: "A task in the app" },
      { find: "final int daysLeft;", note: "Comes from the API, never computed in the app" },
      { find: "final bool? isOwner;", note: "Detail only: am I the creator? (shows Edit/Delete)" },
      { find: "factory Task.fromJson(Map<String, dynamic> json) {", note: "<b>JSON → Task</b>" },
    ] },
  { path: "app/lib/models/user.dart", owners: [2, 1], what: "The logged-in user (<code>id</code>, <code>name</code>, optional <code>email</code>) with <code>fromJson</code>.",
    keys: [{ find: "factory User.fromJson(Map<String, dynamic> json) {", note: "JSON → User" }] },
  { path: "app/lib/models/course.dart", owners: [2, 3], what: "A course (<code>id</code>, <code>code</code> like CSC452, <code>name</code>). Used by the form's course dropdown.",
    keys: [{ find: "factory Course.fromJson(Map<String, dynamic> json) {", note: "JSON → Course" }] },
  { path: "app/lib/services/api_service.dart", owners: [2, 3, 1], what: "<b>Every HTTP call to the server lives here.</b> Screens call simple methods like <code>getTasks('week')</code>; this file builds the request, adds the login token, sends JSON, and turns errors into an <code>ApiException</code> with an HTTP status and message.",
    keys: [
      { find: "class ApiException implements Exception {", note: "A failed call: <code>status</code> (0 = no connection) + <code>message</code>" },
      { find: "Future<User> login(String email, String password) async {", note: "<b>Member 1</b>: POST /login" },
      { find: "Future<User> register(String name, String email, String password) async {", note: "<b>Member 1</b>: POST /register" },
      { find: "Future<List<Task>> getTasks(String filter) async {", note: "<b>Member 2</b>: GET /tasks?filter=week|all|done" },
      { find: "Future<int> setDone(int taskId, bool done) async {", note: "<b>Member 2</b>: POST (done) or DELETE (not done) /tasks/:id/done" },
      { find: "Future<Task> getTask(int id) async {", note: "<b>Member 3</b>: GET /tasks/:id" },
      { find: "Future<Task> createTask(TaskInput input) async {", note: "<b>Member 3</b>: POST /tasks" },
      { find: "Future<Task> updateTask(int id, TaskInput input) async {", note: "<b>Member 3</b>: PUT /tasks/:id" },
      { find: "Future<void> deleteTask(int id) async {", note: "<b>Member 3</b>: DELETE /tasks/:id" },
      { find: "Future<List<Course>> getCourses() async {", note: "<b>Member 3</b>: GET /courses (dropdown)" },
      { find: "User _startSession(dynamic data) {", note: "Save token + user in <code>Session</code>" },
      { find: "Future<dynamic> _send(String method, String path, [Object? body]) async {", note: "<b>The one place that talks HTTP</b>" },
      { find: "if (token != null) request.headers['Authorization'] = 'Bearer $token';", note: "Login token on every request" },
      { find: "final streamed = await _client.send(request).timeout(_timeout);", note: "Send, give up after 10 s" },
      { find: "data = jsonDecode(utf8.decode(response.bodyBytes));", note: "JSON text → Dart Map/List (UTF-8 so Thai text works)" },
      { find: "throw ApiException(response.statusCode, message);", note: "Server said no → exception with its message" },
    ] },
  { path: "app/lib/config.dart", owners: [2], what: "The server address. By default the live API on Vercel; can be changed at run time with <code>--dart-define=API_BASE=...</code>.",
    keys: [{ find: "const String apiBase = String.fromEnvironment(", note: "Base URL for every request" }] },
  { path: "app/lib/utils/date_format.dart", owners: [2, 3], what: "\"2026-11-28\" → \"Sat 28 Nov\" for cards and the detail screen.",
    keys: [{ find: "String formatDue(String ymd) {", note: "Date string → short readable date" }] },

  // ===== Member 3
  { path: "app/lib/screens/task_detail_screen.dart", owners: [3], what: "<b>Screen S5.</b> One task: title, type, due date, course, who added it, description, and how many classmates finished it. Big button to mark it done/not done. Edit and Delete appear <b>only for the person who added it</b>. Returns <code>true</code> to the list when something changed so the list reloads.",
    keys: [
      { find: "final int taskId;", note: "The list passes only the <b>id</b>; this screen loads the rest" },
      { find: "bool _changed = false;", note: "Remember if anything changed, to tell the list" },
      { find: "void _close() => Navigator.pop(context, _changed);", note: "Go back <b>with a result</b>" },
      { find: "bool _handleGone(ApiException e) {", note: "Task deleted by someone else (404) → message + back" },
      { find: "Future<void> _load() async {", note: "GET /tasks/:id" },
      { find: "Future<void> _toggleDone() async {", note: "Mark as done / not done, then reload" },
      { find: "Future<void> _edit() async {", note: "Open the form with this task, reload if saved" },
      { find: "Future<void> _delete() async {", note: "<b>Delete</b>" },
      { find: "final ok = await showDialog<bool>(", note: "Ask first: AlertDialog returns true/false" },
      { find: "await widget.api.deleteTask(task.id);", note: "DELETE /tasks/:id" },
      { find: "return PopScope(", note: "Back button also returns <code>_changed</code>" },
      { find: "if (isOwner) ...[", note: "Edit/Delete only if <code>is_owner</code> (server checks too)" },
      { find: "Widget _details(BuildContext context, Task task) {", note: "The info rows" },
      { find: "_InfoRow(icon: Icons.groups_outlined, text: doneCountText(task.doneCount ?? 0)),", note: "\"2 classmates finished this\"" },
      { find: "Widget _doneButton(Task task) {", note: "Filled button when not done, outlined when done" },
      { find: "class _InfoRow extends StatelessWidget {", note: "Icon + text row (private widget, only used here)" },
    ] },
  { path: "app/lib/screens/task_form_screen.dart", owners: [3], what: "<b>Screen S6.</b> One form for both <b>Add</b> (<code>existing</code> is null) and <b>Edit</b> (<code>existing</code> is the task). Title, course dropdown, type buttons, date picker, description. Saves with POST or PUT and returns <code>true</code>.",
    keys: [
      { find: "final Task? existing;", note: "null = Add, a task = Edit" },
      { find: "bool get _isCreate => widget.existing == null;", note: "Add or Edit?" },
      { find: "final String _today = todayBangkok();", note: "\"Today\" uses Bangkok time, like the server" },
      { find: "_title = TextEditingController(text: t?.title ?? '');", note: "Edit: fields start with the task's values" },
      { find: "Future<void> _loadCourses() async {", note: "GET /courses for the dropdown, pre-select CSC452" },
      { find: "Future<void> _pickDate() async {", note: "<b>Date picker</b>" },
      { find: "final picked = await showDatePicker(", note: "<code>showDatePicker</code>: from today to 1 year ahead" },
      { find: "Future<void> _save() async {", note: "<b>What Save does</b>" },
      { find: "final input = TaskInput(", note: "Form values → <code>TaskInput</code>" },
      { find: "await widget.api.createTask(input);", note: "Add → POST" },
      { find: "await widget.api.updateTask(widget.existing!.id, input);", note: "Edit → PUT" },
      { find: "Navigator.pop(context, true);", note: "Close and tell the previous screen \"saved\"" },
      { find: "case 400:", note: "Server rejected the data → show its reason" },
      { find: "maxLength: 100,", note: "Title counter 0/100" },
      { find: "SegmentedButton<String>(", note: "Assignment / Quiz / Exam" },
      { find: "FormField<String>(", note: "Custom form field so the date is validated like the others" },
      { find: "return DropdownButtonFormField<int>(", note: "Course dropdown" },
    ] },
  { path: "app/lib/utils/dates.dart", owners: [3], what: "Dates as \"YYYY-MM-DD\" strings, the same format the API uses. <code>todayBangkok()</code> gives the Bangkok date so the date picker agrees with the server even if the phone is set to another time zone.",
    keys: [
      { find: "String todayBangkok([DateTime? now]) {", note: "Today in Bangkok (UTC+7)" },
      { find: "String addDays(String ymd, int days)", note: "\"2026-12-31\" + 1 → \"2027-01-01\"" },
    ] },

  // ===== Backend, owned per feature (full-stack split)
  { path: "api/src/routes/auth.js", owners: [1], what: "<b>Member 1's REST routes.</b> <code>POST /register</code> (check input, hash the password with bcrypt, save the user, return a token), <code>POST /login</code> (find the user, compare the password, return a token) and <code>GET /me</code>.",
    keys: [
      { find: "const router = express.Router();", note: "An Express <code>Router</code>: a group of routes mounted in <code>index.js</code>" },
      { find: "router.post(\"/register\", async (req, res) => {", note: "<b>POST /register</b>" },
      { find: "const { error, value } = validateRegister(req.body);", note: "Check the JSON body; bad input → 400" },
      { find: "const passwordHash = await bcrypt.hash(value.password, BCRYPT_COST);", note: "Never store the real password, only a bcrypt hash" },
      { find: "if (!user) return res.status(409).json({ error: \"Email already registered\" });", note: "409 Conflict: email taken" },
      { find: "res.status(201).json({ token: signToken(user), user });", note: "201 Created + token (the app saves it in <code>Session</code>)" },
      { find: "router.post(\"/login\", async (req, res) => {", note: "<b>POST /login</b>" },
      { find: "const passwordOk = await bcrypt.compare(value.password, row ? row.passwordHash : DUMMY_HASH);", note: "Compare typed password with the stored hash" },
      { find: "if (!row || !passwordOk) return res.status(401).json({ error: \"Invalid email or password\" });", note: "Same 401 message for unknown email and wrong password (don't reveal which)" },
      { find: "router.get(\"/me\", requireAuth, (req, res) => {", note: "<code>GET /me</code>: who does this token belong to?" },
    ] },
  { path: "api/src/middleware/auth.js", owners: [1], what: "<b>The login check for every protected route.</b> Express <i>middleware</i> runs before the route: it reads <code>Authorization: Bearer &lt;token&gt;</code>, verifies it, and puts the user in <code>req.user</code>. No token or a bad token → 401, and the route never runs.",
    keys: [
      { find: "function requireAuth(req, res, next) {", note: "Middleware = function(req, res, <b>next</b>)" },
      { find: "req.get(\"authorization\")", note: "Read the header the app sends" },
      { find: "if (!match) return res.status(401).json({ error: \"Not logged in\" });", note: "No token → 401" },
      { find: "req.user = verifyToken(match[1]);", note: "Valid → <code>req.user = { id, name }</code>; routes use <code>req.user.id</code>" },
      { find: "return next();", note: "<code>next()</code> = continue to the route" },
      { find: "if (err.name === \"TokenExpiredError\") {", note: "Expired → 401 \"Session expired\" (the app sends you to Login)" },
    ] },
  { path: "api/src/lib/token.js", owners: [1], what: "Creates and checks login tokens (JWT). The token holds the user's id and name, is signed with the secret <code>JWT_SECRET</code> from <code>.env</code>, and expires after 7 days.",
    keys: [
      { find: "const s = process.env.JWT_SECRET;", note: "Secret comes from <code>.env</code> (dotenv), never from the code" },
      { find: "function signToken(user) {", note: "Make a token after login/register" },
      { find: "function verifyToken(token) {", note: "Check a token (used by the middleware)" },
    ] },
  { path: "api/src/repos/users.js", owners: [1], what: "Database code for users (Prisma). Like a mysql2 query file: <code>findUnique</code> ≈ <code>SELECT … WHERE email = ?</code>, <code>create</code> ≈ <code>INSERT</code>.",
    keys: [
      { find: "function findByEmailForLogin(email) {", note: "<code>SELECT * FROM users WHERE email = ?</code>" },
      { find: "const user = await prisma.user.create({ data: { name, email, passwordHash } });", note: "<code>INSERT INTO users …</code>" },
      { find: "if (err.code === \"P2002\") return null;", note: "Email already exists (UNIQUE) → the route answers 409" },
    ] },
  { path: "api/src/lib/validate.js", owners: [1, 3], what: "The server's input rules (the app's <code>validators.dart</code> mirrors them, but <b>the server is the real rule</b>). Each function returns <code>{ error }</code> or <code>{ value }</code> (cleaned input).",
    keys: [
      { find: "function validateRegister(body) {", note: "<b>Member 1</b>: name, email, password 6+" },
      { find: "function validateLogin(body) {", note: "<b>Member 1</b>: email + password present" },
      { find: "function validateTask(body, { today, isCreate }) {", note: "<b>Member 3</b>: title, course, type, due date, description" },
      { find: "if (isCreate && b.due_date < today) return fail(\"Due date cannot be in the past\");", note: "<b>Member 3</b>: no past dates for new tasks" },
      { find: "function parseId(param) {", note: "<code>/tasks/:id</code> → a number, or 404" },
    ] },
  { path: "api/src/routes/tasks.js", owners: [2, 3], what: "All <code>/tasks</code> REST routes. <b>Member 2</b>: the list (<code>GET /tasks</code>) and done (<code>POST/DELETE /tasks/:id/done</code>). <b>Member 3</b>: one task (<code>GET /tasks/:id</code>), create, edit, delete, and the owner check. The user always comes from the token (<code>req.user.id</code>), never from the request body.",
    keys: [
      { find: "async function checkOwner(id, req, res) {", note: "<b>Member 3</b>: 404 if missing, then 403 if not the creator" },
      { find: "router.get(\"/\", async (req, res) => {", note: "<b>Member 2</b>: GET /tasks?filter=week|all|done" },
      { find: "res.json(await tasks.listTasks({ me: req.user.id, today: todayBangkok(), filter }));", note: "<b>Member 2</b>: me = token's user, today = Bangkok date" },
      { find: "router.get(\"/:id\", async (req, res) => {", note: "<b>Member 3</b>: GET /tasks/:id" },
      { find: "router.post(\"/\", async (req, res) => {", note: "<b>Member 3</b>: POST /tasks (validate → 400, else 201)" },
      { find: "router.put(\"/:id\", async (req, res) => {", note: "<b>Member 3</b>: PUT /tasks/:id (creator only)" },
      { find: "router.delete(\"/:id\", async (req, res) => {", note: "<b>Member 3</b>: DELETE /tasks/:id → 204 No Content" },
      { find: "router.post(\"/:id/done\", async (req, res) => {", note: "<b>Member 2</b>: mark done for me → <code>{ done, done_count }</code>" },
      { find: "router.delete(\"/:id/done\", async (req, res) => {", note: "<b>Member 2</b>: undo done" },
    ] },
  { path: "api/src/repos/tasks.js", owners: [2, 3], what: "Database code for tasks (Prisma). Turns database rows (camelCase, Date objects) into the JSON the app gets (snake_case, \"YYYY-MM-DD\", <code>days_left</code>).",
    keys: [
      { find: "function toTaskListItem(t, today) {", note: "<b>Member 2</b>: row → JSON for the list (adds <code>days_left</code>, <code>done</code>)" },
      { find: "async function listTasks({ me, today, filter }) {", note: "<b>Member 2</b>: the list query" },
      { find: "where = { dueDate: { lte: fromDateStr(addDays(today, 7)) }, done: { none: { userId: me } } };", note: "<b>Member 2</b>: This Week = due ≤ today+7 AND not done by me" },
      { find: "orderBy: [{ dueDate: \"asc\" }, { id: \"asc\" }],", note: "<b>Member 2</b>: <code>ORDER BY due_date</code>" },
      { find: "async function getTaskDetail(id, { me, today }) {", note: "<b>Member 3</b>: one task + creator name + done count" },
      { find: "_count: { select: { done: true } },", note: "<b>Member 3</b>: Prisma writes the COUNT query for us" },
      { find: "async function createTask(data, me) {", note: "<b>Member 3</b>: INSERT" },
      { find: "async function updateTask(id, data) {", note: "<b>Member 3</b>: UPDATE" },
      { find: "async function deleteTask(id) {", note: "<b>Member 3</b>: DELETE (done rows go too: ON DELETE CASCADE)" },
      { find: "async function markDone(me, taskId) {", note: "<b>Member 2</b>: insert into task_done (twice = still one row)" },
      { find: "async function unmarkDone(me, taskId) {", note: "<b>Member 2</b>: delete from task_done" },
    ] },
  { path: "api/src/lib/dates.js", owners: [2], what: "All server date logic. <code>todayBangkok()</code> is \"today\" for everyone, and <code>daysBetween</code> computes <code>days_left</code>, so every phone shows the same \"2 days left\".",
    keys: [
      { find: "function todayBangkok(now = new Date()) {", note: "Today in Bangkok (UTC+7)" },
      { find: "function daysBetween(from, to) {", note: "<code>days_left</code> = days from today to the due date" },
    ] },
  { path: "api/prisma/schema.prisma", owners: [2, "s"], lang: "prisma", what: "<b>The database tables</b> (like the <code>CREATE TABLE</code> SQL from class): users, courses, tasks, and task_done (who finished which task). <code>npx prisma db push</code> creates them in the database.",
    keys: [
      { find: "model User {", note: "users table; email is UNIQUE" },
      { find: "model Course {", note: "courses table" },
      { find: "model Task {", note: "tasks: belongs to a course and its creator" },
      { find: "@@index([dueDate])", note: "Index so sorting/filtering by due date is fast" },
      { find: "model TaskDone {", note: "<b>task_done</b>: one row = one user finished one task (this is how done is per person)" },
      { find: "@@id([userId, taskId])", note: "Primary key (user, task): can't be done twice" },
    ] },
  { path: "api/src/routes/courses.js", owners: [3], what: "<code>GET /courses</code>: the course list for the Add/Edit form's dropdown.",
    keys: [{ find: "router.get(\"/\", async (req, res) => {", note: "GET /courses" }] },
  { path: "api/src/repos/courses.js", owners: [3], what: "Database code for courses.",
    keys: [
      { find: "function listCourses() {", note: "<code>SELECT id, code, name FROM courses ORDER BY code</code>" },
      { find: "async function courseExists(id) {", note: "Used before saving a task (bad course → 400)" },
    ] },

  // ===== Shared setup
  { path: "api/src/index.js", owners: ["s"], what: "<b>The server app</b> (everyone should know this one). Creates Express, adds <code>cors</code> and JSON parsing, mounts each member's routes, and turns unknown routes and crashes into JSON errors. Vercel runs this file.",
    keys: [
      { find: "require(\"dotenv\").config({ quiet: true });", note: "dotenv: load secrets from <code>.env</code>" },
      { find: "const app = express();", note: "Create the Express app" },
      { find: "app.use(cors());", note: "cors: allow the web app (another domain) to call the API" },
      { find: "app.use(express.json({ limit: \"100kb\" }));", note: "Parse JSON bodies into <code>req.body</code>" },
      { find: "app.use(authRoutes);", note: "<b>Member 1</b>'s routes" },
      { find: "app.use(\"/courses\", requireAuth, courseRoutes);", note: "<b>Member 3</b>: /courses (login required)" },
      { find: "app.use(\"/tasks\", requireAuth, taskRoutes);", note: "<b>Members 2 + 3</b>: /tasks (login required)" },
      { find: "app.use((req, res) => res.status(404).json({ error: \"Not found\" }));", note: "Unknown URL → JSON 404" },
      { find: "app.use((err, req, res, next) => {", note: "Any crash → 500 \"Something went wrong\"" },
      { find: "module.exports = app;", note: "Export for Vercel (no <code>app.listen</code> here)" },
    ] },
  { path: "api/src/dev.js", owners: ["s"], what: "Runs the server on your PC: <code>npm run dev</code> → http://localhost:3000.", keys: [{ find: "app.listen(", note: "<code>app.listen</code> only for local dev" }] },
  { path: "api/src/db.js", owners: ["s"], what: "Creates the one Prisma client that talks to the Neon Postgres database (like creating the mysql2 connection in class). The database URL comes from <code>.env</code>.",
    keys: [
      { find: "const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });", note: "Connect using <code>DATABASE_URL</code> from .env" },
      { find: "log: process.env.PRISMA_LOG ? [\"query\"] : [],", note: "<code>PRISMA_LOG=1 npm run dev</code> prints the SQL Prisma writes" },
    ] },
  { path: "api/prisma/seed.js", owners: ["s"], what: "Fills the database with demo users and tasks (dates relative to today). Run with <code>npx prisma db seed</code> before a demo.", keys: [] },
  { path: "app/pubspec.yaml", owners: ["s"], lang: "yaml", what: "Flutter project settings: app name, Dart version, packages (<code>http</code>, <code>material_ui</code>).", keys: [] },
  { path: "app/android/app/src/main/AndroidManifest.xml", owners: ["s"], lang: "xml", what: "Android settings: app label \"DueSoon\" and the INTERNET permission (needed to reach the API).",
    keys: [{ find: "android.permission.INTERNET", note: "Without this, release builds can't call the API" }] },
];

const TESTS = [
  "app/test/validators_test.dart", "app/test/models_test.dart", "app/test/api_service_test.dart",
  "app/test/login_screen_test.dart", "app/test/home_screen_test.dart", "app/test/urgency_test.dart",
  "app/test/grouped_rows_test.dart", "app/test/task_card_test.dart", "app/test/task_rules_test.dart",
  "app/test/task_screens_test.dart", "api/test/*.test.js", "api/test-api/*.api.js",
];

// ---------------------------------------------------------------- flows
const FLOWS = [
  { owners: [1], title: "Opening the app and logging in", steps: [
    ["app/lib/main.dart", "void main()", "The app starts; <code>MaterialApp</code> shows the Splash screen first."],
    ["app/lib/screens/splash_screen.dart", "Future.delayed(SplashScreen.duration", "After 2 seconds…"],
    ["app/lib/screens/splash_screen.dart", "Navigator.pushReplacement(", "…Splash is <b>replaced</b> by Login."],
    ["app/lib/screens/login_screen.dart", "Future<void> _submit() async", "User taps Log in."],
    ["app/lib/screens/login_screen.dart", "if (_loading || !_formKey.currentState!.validate()) return;", "Each field's validator runs; red messages if something's wrong."],
    ["app/lib/services/api_service.dart", "Future<User> login(String email, String password) async {", "<code>POST /login</code> with the email and password as JSON."],
    ["app/lib/services/api_service.dart", "Future<dynamic> _send(String method, String path, [Object? body]) async {", "Builds and sends the HTTP request."],
    ["api/src/routes/auth.js", "router.post(\"/login\", async (req, res) => {", "Server checks the password and returns a <b>token</b> + the user."],
    ["app/lib/services/api_service.dart", "User _startSession(dynamic data) {", "The token is saved in <code>Session</code>."],
    ["app/lib/screens/login_screen.dart", "Navigator.pushReplacement(", "Home replaces Login."],
  ] },
  { owners: [1], title: "Errors: wrong password, no internet, session expired", steps: [
    ["app/lib/screens/login_screen.dart", "final message = switch (e.status) {", "401 → \"Invalid email or password\" in a SnackBar."],
    ["app/lib/services/api_service.dart", "} on TimeoutException {", "No reply in 10 s / no internet → status 0 → \"Something went wrong\"."],
    ["app/lib/utils/api_errors.dart", "if (error is ApiException && error.status == 401) {", "Later, if the token expires: back to Login with \"Session expired\"."],
  ] },
  { owners: [2], title: "Showing the This Week list", steps: [
    ["app/lib/screens/home_screen.dart", "return DefaultTabController(", "Home has 3 tabs."],
    ["app/lib/screens/home_screen.dart", "TaskListTab(key: ValueKey('$filter-$_version'), filter: filter, api: _api),", "Each tab is a <code>TaskListTab</code> with its filter."],
    ["app/lib/widgets/task_list_tab.dart", "void initState()", "When the tab appears it calls <code>_load()</code>."],
    ["app/lib/services/api_service.dart", "Future<List<Task>> getTasks(String filter) async {", "<code>GET /tasks?filter=week</code>…"],
    ["app/lib/services/api_service.dart", "if (token != null) request.headers['Authorization'] = 'Bearer $token';", "…with the login token."],
    ["api/src/middleware/auth.js", "function requireAuth(req, res, next) {", "Server checks the token → knows who you are."],
    ["api/src/routes/tasks.js", "router.get(\"/\", async (req, res) => {", "Server returns your tasks, sorted, with <code>days_left</code> and <code>done</code>."],
    ["app/lib/models/task.dart", "factory Task.fromJson(Map<String, dynamic> json) {", "Each JSON object becomes a <code>Task</code>."],
    ["app/lib/widgets/task_list_tab.dart", "setState(() {", "<code>setState</code> stores the list → the tab rebuilds."],
    ["app/lib/widgets/grouped_task_list.dart", "List<ListRow> groupedRows(List<Task> tasks)", "Tasks are grouped: Overdue, Today, Tomorrow…"],
    ["app/lib/widgets/task_list_tab.dart", "body = ListView.builder(", "<code>ListView.builder</code> draws headers and cards."],
    ["app/lib/widgets/task_card.dart", "final color = urgencyColor(urgencyOf(task.daysLeft, task.done), theme.colorScheme);", "Each card is colored by how soon it's due."],
  ] },
  { owners: [2], title: "Ticking a task as done", steps: [
    ["app/lib/widgets/task_card.dart", ": Checkbox(", "User taps the checkbox."],
    ["app/lib/widgets/task_list_tab.dart", "Future<void> _toggleDone(Task task, bool done) async {", "The card shows a spinner (the id goes into <code>_busy</code>)."],
    ["app/lib/services/api_service.dart", "Future<int> setDone(int taskId, bool done) async {", "<code>POST /tasks/:id/done</code> (or DELETE to undo)."],
    ["api/src/routes/tasks.js", "router.post(\"/:id/done\", async (req, res) => {", "Server marks it done <b>for you only</b>."],
    ["app/lib/widgets/task_list_tab.dart", "await _load();", "List reloads; a done task leaves This Week and appears in Done."],
  ] },
  { owners: [3, 2], title: "Opening a task", steps: [
    ["app/lib/widgets/task_list_tab.dart", "Future<void> _openDetail(Task task) async {", "Card tap → <code>Navigator.push</code> to the detail screen with the task's <b>id</b>, and wait."],
    ["app/lib/screens/task_detail_screen.dart", "Future<void> _load() async {", "Detail screen loads <code>GET /tasks/:id</code>."],
    ["app/lib/screens/task_detail_screen.dart", "if (isOwner) ...[", "Edit/Delete only for the creator."],
    ["app/lib/screens/task_detail_screen.dart", "Future<void> _toggleDone() async {", "Mark as done here too; <code>_changed = true</code>."],
    ["app/lib/screens/task_detail_screen.dart", "return PopScope(", "Going back returns <code>_changed</code>…"],
    ["app/lib/widgets/task_list_tab.dart", "if (changed == true && mounted) await _load();", "…and the list reloads if it's <code>true</code>."],
  ] },
  { owners: [3], title: "Adding a task", steps: [
    ["app/lib/screens/home_screen.dart", "Future<void> _addTask() async", "+ button opens the form and waits for a result."],
    ["app/lib/screens/task_form_screen.dart", "Future<void> _loadCourses() async {", "Form loads courses for the dropdown."],
    ["app/lib/screens/task_form_screen.dart", "Future<void> _pickDate() async {", "Date picker: today to 1 year ahead."],
    ["app/lib/screens/task_form_screen.dart", "Future<void> _save() async {", "Save: validate all fields."],
    ["app/lib/screens/task_form_screen.dart", "final input = TaskInput(", "Values → <code>TaskInput</code>…"],
    ["app/lib/models/task.dart", "Map<String, dynamic> toJson() => {", "…→ JSON."],
    ["app/lib/services/api_service.dart", "Future<Task> createTask(TaskInput input) async {", "<code>POST /tasks</code>."],
    ["api/src/routes/tasks.js", "router.post(\"/\", async (req, res) => {", "Server checks the same rules again, saves, returns 201."],
    ["app/lib/screens/task_form_screen.dart", "Navigator.pop(context, true);", "SnackBar \"Task added\", form closes with <code>true</code>…"],
    ["app/lib/screens/home_screen.dart", "if (saved == true && mounted) setState(() => _version++);", "…Home bumps <code>_version</code> → all tabs reload."],
  ] },
  { owners: [3], title: "Editing and deleting", steps: [
    ["app/lib/screens/task_detail_screen.dart", "Future<void> _edit() async {", "Edit opens the same form with <code>existing: task</code>."],
    ["app/lib/screens/task_form_screen.dart", "_title = TextEditingController(text: t?.title ?? '');", "Fields start filled in."],
    ["app/lib/screens/task_form_screen.dart", "await widget.api.updateTask(widget.existing!.id, input);", "<code>PUT /tasks/:id</code>."],
    ["api/src/routes/tasks.js", "async function checkOwner(id, req, res) {", "Server: 404 if gone, 403 if you're not the creator."],
    ["app/lib/screens/task_detail_screen.dart", "Future<void> _delete() async {", "Delete asks first (AlertDialog)…"],
    ["app/lib/services/api_service.dart", "Future<void> deleteTask(int id) async {", "…then <code>DELETE /tasks/:id</code>."],
    ["app/lib/screens/task_detail_screen.dart", "void _close() => Navigator.pop(context, _changed);", "Back to a refreshed list."],
  ] },
];

// Server-side flows (one per member)
FLOWS.push(
  { owners: [1], title: "Server: what happens on POST /login", steps: [
    ["api/src/index.js", "app.use(express.json({ limit: \"100kb\" }));", "Express turns the JSON body into <code>req.body</code>."],
    ["api/src/index.js", "app.use(authRoutes);", "The request reaches Member 1's router."],
    ["api/src/routes/auth.js", "router.post(\"/login\", async (req, res) => {", "The login route runs."],
    ["api/src/lib/validate.js", "function validateLogin(body) {", "Input check (missing fields → 400)."],
    ["api/src/repos/users.js", "function findByEmailForLogin(email) {", "Find the user by email in the database."],
    ["api/src/routes/auth.js", "const passwordOk = await bcrypt.compare(value.password, row ? row.passwordHash : DUMMY_HASH);", "bcrypt compares the password with the stored hash."],
    ["api/src/lib/token.js", "function signToken(user) {", "Create a JWT signed with <code>JWT_SECRET</code>."],
    ["api/src/routes/auth.js", "const user = users.toUserJson(row);", "Answer <code>{ token, user }</code> as JSON (200)."],
    ["api/src/middleware/auth.js", "function requireAuth(req, res, next) {", "Every later request: this middleware checks the token first."],
  ] },
  { owners: [2], title: "Server: building the This Week list", steps: [
    ["api/src/index.js", "app.use(\"/tasks\", requireAuth, taskRoutes);", "<code>/tasks</code> needs a valid token (Member 1's middleware)."],
    ["api/src/routes/tasks.js", "router.get(\"/\", async (req, res) => {", "<code>GET /tasks?filter=week</code>: check the filter (else 400)."],
    ["api/src/lib/dates.js", "function todayBangkok(now = new Date()) {", "Today = Bangkok date."],
    ["api/src/repos/tasks.js", "where = { dueDate: { lte: fromDateStr(addDays(today, 7)) }, done: { none: { userId: me } } };", "Due within 7 days (overdue included) and <b>not done by me</b>."],
    ["api/src/repos/tasks.js", "orderBy: [{ dueDate: \"asc\" }, { id: \"asc\" }],", "Soonest first."],
    ["api/src/repos/tasks.js", "function toTaskListItem(t, today) {", "Each row → JSON with <code>days_left</code> and <code>done</code>."],
    ["api/src/lib/dates.js", "function daysBetween(from, to) {", "<code>days_left</code> = days from today to the due date."],
    ["api/src/routes/tasks.js", "router.post(\"/:id/done\", async (req, res) => {", "Ticking done inserts a <code>task_done</code> row for me…"],
    ["api/src/repos/tasks.js", "async function markDone(me, taskId) {", "…once only (upsert), so the count stays right."],
  ] },
  { owners: [3], title: "Server: who may edit or delete", steps: [
    ["api/src/routes/tasks.js", "router.put(\"/:id\", async (req, res) => {", "<code>PUT /tasks/:id</code> arrives with a token."],
    ["api/src/lib/validate.js", "function parseId(param) {", "<code>:id</code> must be a number (else 404)."],
    ["api/src/routes/tasks.js", "async function checkOwner(id, req, res) {", "Task missing → <b>404</b>; not created by <code>req.user.id</code> → <b>403</b>."],
    ["api/src/lib/validate.js", "function validateTask(body, { today, isCreate }) {", "Same rules as the form (title, type, date…) → 400 if wrong."],
    ["api/src/repos/courses.js", "async function courseExists(id) {", "The course must exist."],
    ["api/src/repos/tasks.js", "async function updateTask(id, data) {", "UPDATE in the database (done marks are kept)."],
    ["api/src/routes/tasks.js", "router.delete(\"/:id\", async (req, res) => {", "Delete: same owner check, then…"],
    ["api/src/repos/tasks.js", "async function deleteTask(id) {", "…DELETE; everyone's done rows go too (CASCADE). Answer 204."],
  ] },
);

// ---------------------------------------------------------------- glossary (Flutter/Dart + backend)
const GLOSSARY = [
  ["StatelessWidget", "A widget that only draws what it's given; it never changes by itself.", "app/lib/widgets/empty_state.dart", "class EmptyState extends StatelessWidget"],
  ["StatefulWidget + State", "A widget with data that can change (loading, typed text, a list). The data lives in its <code>State</code> class.", "app/lib/screens/login_screen.dart", "class _LoginScreenState extends State<LoginScreen> {"],
  ["setState", "Change state data and ask Flutter to rebuild the screen with it.", "app/lib/screens/login_screen.dart", "setState(() => _loading = true);"],
  ["initState / dispose", "<code>initState</code> runs once when the screen is created (start loading). <code>dispose</code> runs when it's removed (clean up controllers).", "app/lib/widgets/task_list_tab.dart", "void initState()"],
  ["mounted", "Is this screen still on screen? Checked after <code>await</code>, because the user may have left.", "app/lib/screens/splash_screen.dart", "if (!mounted) return;"],
  ["Future, async, await", "Work that finishes later (network). <code>await</code> waits for it without freezing the app.", "app/lib/widgets/task_list_tab.dart", "final tasks = await widget.api.getTasks(widget.filter);"],
  ["Navigator.push / pop", "Open a screen on top / close it. <code>pop(context, true)</code> sends a result back to the screen that opened it.", "app/lib/screens/home_screen.dart", "final saved = await Navigator.push<bool>("],
  ["pushReplacement", "Open a screen and remove the current one (Back can't return to it).", "app/lib/screens/splash_screen.dart", "Navigator.pushReplacement("],
  ["pushAndRemoveUntil", "Open a screen and remove all screens below it (used after register, logout, session expired).", "app/lib/screens/register_screen.dart", "Navigator.pushAndRemoveUntil("],
  ["Form + GlobalKey + validate()", "<code>Form</code> groups fields; its key lets us call <code>validate()</code>, which runs every field's validator.", "app/lib/screens/login_screen.dart", "final _formKey = GlobalKey<FormState>();"],
  ["TextFormField + validator", "A text input that shows a red error when its validator returns a message.", "app/lib/screens/login_screen.dart", "validator: Validators.email,"],
  ["TextEditingController", "Reads (and can set) the text inside a text field.", "app/lib/screens/task_form_screen.dart", "_title = TextEditingController(text: t?.title ?? '');"],
  ["SnackBar", "A short message at the bottom of the screen.", "app/lib/screens/task_detail_screen.dart", ".showSnackBar(const SnackBar(content: Text('Task deleted')));"],
  ["DefaultTabController, TabBar, TabBarView", "Tabs: the controller links the tab titles with the pages.", "app/lib/screens/home_screen.dart", "return DefaultTabController("],
  ["ListView.builder", "A scrolling list that builds rows only when they're visible.", "app/lib/widgets/task_list_tab.dart", "body = ListView.builder("],
  ["RefreshIndicator", "Pull down to refresh.", "app/lib/widgets/task_list_tab.dart", "return RefreshIndicator(onRefresh: _load, child: body);"],
  ["AlertDialog / showDialog", "A pop-up that asks a question and returns the answer.", "app/lib/screens/task_detail_screen.dart", "final ok = await showDialog<bool>("],
  ["showDatePicker", "Flutter's calendar pop-up.", "app/lib/screens/task_form_screen.dart", "final picked = await showDatePicker("],
  ["DropdownButtonFormField", "A dropdown that works inside a Form (with a validator).", "app/lib/screens/task_form_screen.dart", "return DropdownButtonFormField<int>("],
  ["SegmentedButton", "A row of connected buttons where one is selected.", "app/lib/screens/task_form_screen.dart", "SegmentedButton<String>("],
  ["Theme / ColorScheme", "All colors come from the theme, so light and dark mode work automatically.", "app/lib/main.dart", "colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)"],
  ["http + jsonDecode", "The <code>http</code> package sends requests; <code>jsonDecode</code> turns the reply text into Maps and Lists.", "app/lib/services/api_service.dart", "data = jsonDecode(utf8.decode(response.bodyBytes));"],
  ["fromJson factory", "A constructor that builds an object from a JSON Map.", "app/lib/models/task.dart", "factory Task.fromJson(Map<String, dynamic> json) {"],
  ["try / on … catch", "Catch errors of a certain type, e.g. <code>on ApiException catch (e)</code>.", "app/lib/screens/login_screen.dart", "} on ApiException catch (e) {"],
  ["switch expression", "<code>switch (x) { a =&gt; ..., _ =&gt; ... }</code> picks a value. <code>_</code> means \"anything else\".", "app/lib/utils/urgency.dart", "String doneCountText(int count) => switch (count) {"],
  ["Null safety: ? ! ??", "<code>String?</code> may be null. <code>x!</code> = \"I'm sure it isn't null\". <code>a ?? b</code> = a, or b if a is null.", "app/lib/screens/task_detail_screen.dart", "_InfoRow(icon: Icons.groups_outlined, text: doneCountText(task.doneCount ?? 0)),"],
  ["Key / ValueKey", "Gives a widget an identity. Changing a <code>ValueKey</code> makes Flutter create a fresh widget (used to reload tabs).", "app/lib/screens/home_screen.dart", "TaskListTab(key: ValueKey('$filter-$_version'), filter: filter, api: _api),"],
  ["material_ui import", "We import <code>package:material_ui/material_ui.dart</code> instead of <code>flutter/material.dart</code>; it provides the same Material widgets (project decision D-36).", "app/lib/main.dart", "import 'package:material_ui/material_ui.dart';"],
  // backend
  ["Express app + routes", "<code>express()</code> creates the server; <code>router.get/post/put/delete(path, handler)</code> answers one URL + method.", "api/src/routes/tasks.js", "router.get(\"/:id\", async (req, res) => {"],
  ["req / res", "<code>req</code> = the request (<code>req.body</code>, <code>req.params.id</code>, <code>req.query.filter</code>); <code>res.status(…).json(…)</code> = the answer.", "api/src/routes/tasks.js", "const filter = req.query.filter ?? \"all\";"],
  ["Middleware", "A function that runs before routes (<code>req, res, next</code>): cors, JSON parsing, the login check.", "api/src/middleware/auth.js", "function requireAuth(req, res, next) {"],
  ["REST + HTTP status codes", "200 OK · 201 Created · 204 No Content · 400 bad input · 401 not logged in · 403 not allowed · 404 not found · 409 conflict · 500 server error.", "api/src/routes/tasks.js", "res.status(201).json(await tasks.getTaskDetail(id, { me: req.user.id, today }));"],
  ["cors", "Lets a web page from another domain (our web app) call the API.", "api/src/index.js", "app.use(cors());"],
  ["dotenv + .env", "Secrets (database URL, JWT secret) live in <code>api/.env</code>, which is never committed; <code>dotenv</code> loads them into <code>process.env</code>.", "api/src/index.js", "require(\"dotenv\").config({ quiet: true });"],
  ["JWT (login token)", "A signed string with the user's id. The server can check it without a database lookup.", "api/src/lib/token.js", "function signToken(user) {"],
  ["bcrypt", "Hashes passwords so the database never stores the real password.", "api/src/routes/auth.js", "const passwordHash = await bcrypt.hash(value.password, BCRYPT_COST);"],
  ["Prisma (vs mysql2 from class)", "Prisma writes the SQL for us: <code>prisma.task.findMany({ where, orderBy })</code> is a SELECT, <code>create</code> an INSERT. Same idea as the mysql2 queries in class, with Postgres (Neon) instead of MySQL (TiDB).", "api/src/repos/tasks.js", "const tasks = await prisma.task.findMany({"],
  ["Schema (tables)", "<code>schema.prisma</code> describes the tables, like CREATE TABLE in SQL.", "api/prisma/schema.prisma", "model TaskDone {"],
];

// ---------------------------------------------------------------- practice questions
const QA = {
  1: [
    ["Why does Splash use <code>pushReplacement</code> instead of <code>push</code>?", "So pressing Back on Login doesn't go back to the splash screen; the splash is removed from the history."],
    ["How does the form know a field is wrong?", "Each <code>TextFormField</code> has a <code>validator</code> that returns an error text or null. <code>_formKey.currentState!.validate()</code> runs them all and shows the red messages."],
    ["Where is the login stored? What happens when you close the app?", "In <code>Session</code> (static fields, memory only). Closing the app forgets it, so you log in again."],
    ["Why check <code>mounted</code> after <code>await</code>?", "The user might have left the screen while waiting for the server; using <code>context</code> then would crash."],
    ["What happens if the token expires?", "The API answers 401; <code>showApiError</code> clears the session and sends you to Login with \"Session expired\"."],
    ["<b>Backend:</b> how does the server know who is calling?", "The app sends <code>Authorization: Bearer &lt;token&gt;</code>. The <code>requireAuth</code> middleware verifies the JWT and sets <code>req.user</code>; routes only trust <code>req.user.id</code>, never an id from the body."],
    ["<b>Backend:</b> how are passwords stored?", "As a bcrypt hash, never the real password. Login compares the typed password with the hash."],
    ["<b>Backend:</b> why the same message for wrong password and unknown email?", "So nobody can find out which emails have accounts."],
  ],
  2: [
    ["How do the three tabs work?", "<code>DefaultTabController</code> + <code>TabBar</code> + <code>TabBarView</code>. Each page is the same <code>TaskListTab</code> widget with a different filter (week / all / done)."],
    ["How does JSON become something the app can show?", "<code>ApiService.getTasks</code> decodes the JSON into a List of Maps, and <code>Task.fromJson</code> turns each Map into a <code>Task</code>."],
    ["Who decides \"2 days left\"? The app or the server?", "The server sends <code>days_left</code> (Bangkok date). The app only picks a color and text from it, so every phone agrees."],
    ["Why does the checkbox show a spinner instead of ticking immediately?", "It waits for the server and reloads, so the screen always shows what the server really saved."],
    ["Why not use <code>ListTile</code> for the cards?", "ListTile has a fixed height and cut off the second line when a title wrapped, so we built the row ourselves."],
    ["<b>Backend:</b> how does the server pick This Week tasks?", "Tasks due on or before today + 7 days (so overdue ones too) that are <b>not</b> in <code>task_done</code> for me, sorted by due date."],
    ["<b>Backend:</b> how can done be different for each student?", "The <code>task_done</code> table has one row per (user, task). Ticking adds my row; my classmates have their own."],
    ["<b>Backend:</b> you used Prisma, not mysql2. What is it?", "A library that writes the SQL for us: <code>findMany</code> = SELECT, <code>create</code> = INSERT. Same REST + database idea as class, with Postgres instead of MySQL."],
  ],
  3: [
    ["How does the detail screen know which task to show?", "The list passes only the task <b>id</b>; the detail screen loads the full task with <code>GET /tasks/:id</code>."],
    ["How does the list know to refresh after you add, edit or delete?", "Screens close with <code>Navigator.pop(context, true)</code>; the screen that opened them awaits that result and reloads when it's true."],
    ["How is one form used for both Add and Edit?", "<code>existing</code> is null for Add; for Edit it's the task, so the fields are pre-filled and Save calls PUT instead of POST."],
    ["Why can't other people edit my task?", "The app hides Edit/Delete when <code>is_owner</code> is false, and the server also refuses with 403. The server is the real rule."],
    ["Why can't I pick a past date?", "The date picker starts at today (Bangkok time) and the validator and server reject past dates for new tasks."],
    ["<b>Backend:</b> what is the difference between 403 and 404?", "404 = the task doesn't exist. 403 = it exists but you didn't create it, so you may not change it. <code>checkOwner</code> checks 404 first, then 403."],
    ["<b>Backend:</b> which HTTP methods does your part use?", "GET /tasks/:id (read), POST /tasks (create → 201), PUT /tasks/:id (update), DELETE /tasks/:id (delete → 204): the four CRUD operations."],
    ["<b>Backend:</b> what happens to done marks when a task is deleted?", "They're deleted too: the database removes the task_done rows automatically (ON DELETE CASCADE)."],
  ],
};

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fileId = (p) => "f-" + p.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8").replace(/\r\n/g, "\n");
const lines = {};
for (const f of FILES) lines[f.path] = read(f.path).replace(/\n$/, "").split("\n");

function lineOf(p, find) {
  const ls = lines[p];
  if (!ls) throw new Error(`Not in FILES: ${p}`);
  const i = ls.findIndex((l) => l.includes(find));
  if (i < 0) throw new Error(`"${find}" not found in ${p}: update the guide`);
  return i + 1;
}
const ownersAttr = (o) => o.join(" ");
const badge = (o) => `<span class="badge m${o}">${esc(o === "s" ? "Shared" : "M" + o)}</span>`;
const lineLink = (p, n, label) => `<a class="ln-link" href="#${fileId(p)}-L${n}" data-file="${fileId(p)}" data-line="${n}">${label}</a>`;

const KW = new Set(("abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for function get if implements import in is late library mixin new null on operator part required rethrow return sealed set show static super switch sync this throw true try typedef var void while with yield let module require exports model enum generator datasource").split(" "));

function highlight(code, lang) {
  let re;
  if (lang === "yaml") re = /(#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)*\b)|([A-Za-z_][\w-]*(?=\s*:))|([\s\S])/g;
  else if (lang === "xml") re = /(<!--[\s\S]*?-->)|("(?:[^"\n])*")|(\b\d+\b)|(<\/?[\w:.-]+|\/?>)|([\s\S])/g;
  else re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(@\w+|\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;
  const out = [];
  let m;
  while ((m = re.exec(code))) {
    if (m[0] === "") { re.lastIndex++; continue; } // never loop on an empty match
    if (m[1] !== undefined) out.push(["c", m[1]]);
    else if (m[2] !== undefined) out.push(["s", m[2]]);
    else if (m[3] !== undefined && m[3] !== "") out.push(["n", m[3]]);
    else if (m[4] !== undefined && m[4] !== "") {
      const w = m[4];
      if (lang === "yaml" || lang === "xml") out.push(["k", w]);
      else out.push([KW.has(w) ? "k" : /^[A-Z]/.test(w) ? "t" : "", w]);
    } else out.push(["", m[5] ?? m[0]]);
  }
  // split tokens into lines, keeping classes
  const res = [[]];
  for (const [cls, text] of out) {
    const parts = text.split("\n");
    parts.forEach((part, i) => {
      if (i > 0) res.push([]);
      if (part) res[res.length - 1].push(cls ? `<span class="${cls}">${esc(part)}</span>` : esc(part));
    });
  }
  return res.map((r) => r.join(""));
}

const langOf = (f) => f.lang || (f.path.endsWith(".dart") ? "dart" : "js");

// ---------------------------------------------------------------- folder tree
function tree() {
  const root = {};
  const add = (p, meta) => {
    const parts = p.split("/");
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) node[part] = { __leaf: meta };
      else node[part] = node[part] || {};
      node = node[part];
    });
  };
  for (const f of FILES) add(f.path, { file: f });
  for (const t of TESTS) add(t, { test: true });
  add("docs/SPEC.md", { doc: "All decisions (D-01…), API contract, rules" });
  add("docs/TEAM.md", { doc: "Who owns what" });
  add("docs/DEMO.md", { doc: "5-minute demo script" });
  add("docs/code-guide.html", { doc: "This guide" });
  add("README.md", { doc: "What it is, how to run" });
  add("docs/tools/build-code-guide.js", { doc: "Rebuilds this guide" });
  const render = (node, depth) => {
    const keys = Object.keys(node).sort((a, b) => {
      const da = !node[a].__leaf, db = !node[b].__leaf;
      return da === db ? a.localeCompare(b) : da ? -1 : 1;
    });
    return `<ul>${keys.map((k) => {
      const v = node[k].__leaf || node[k];
      if (!node[k].__leaf) return `<li class="t-dir"><details ${depth < 3 ? "open" : ""}><summary>${esc(k)}/</summary>${render(v, depth + 1)}</details></li>`;
      if (v.file) {
        const o = v.file.owners;
        return `<li class="t-file" data-owners="${ownersAttr(o)}"><a href="#${fileId(v.file.path)}">${esc(k)}</a> ${o.map(badge).join("")}</li>`;
      }
      if (v.test) return `<li class="t-file t-muted" title="Test file (not covered here)">${esc(k)} <span class="badge mt">test</span></li>`;
      if (v.doc) return `<li class="t-file t-muted">${esc(k)} <span class="t-doc">${esc(v.doc)}</span></li>`;
      return `<li class="t-dir"><details ${depth < 3 ? "open" : ""}><summary>${esc(k)}/</summary>${render(v, depth + 1)}</details></li>`;
    }).join("")}</ul>`;
  };
  return render(root, 0);
}

// ---------------------------------------------------------------- sections
function fileCard(f) {
  const n = lines[f.path].length;
  const hl = highlight(lines[f.path].join("\n"), langOf(f));
  const id = fileId(f.path);
  const keys = (f.keys || []).map((k) => {
    const ln = lineOf(f.path, k.find);
    return `<li>${lineLink(f.path, ln, "line " + ln)} <span>${k.note}</span></li>`;
  }).join("");
  const code = hl.map((h, i) => `<div class="cl" id="${id}-L${i + 1}"><span class="cn">${i + 1}</span><span class="cc">${h || " "}</span></div>`).join("");
  return `<article class="file" id="${id}" data-owners="${ownersAttr(f.owners)}" data-search="${esc((f.path + " " + f.what.replace(/<[^>]+>/g, "")).toLowerCase())}">
  <header><div class="fpath"><span class="dir">${esc(path.posix.dirname(f.path))}/</span><b>${esc(path.posix.basename(f.path))}</b></div>
  <div class="fmeta">${f.owners.map(badge).join("")}<span class="lines">${n} lines</span><button class="copy" data-path="${esc(f.path)}" title="Copy path">copy path</button></div></header>
  <p class="what">${f.what}</p>
  ${keys ? `<ul class="keys">${keys}</ul>` : ""}
  <details class="code" data-id="${id}"><summary>Show code</summary><div class="codebox lang-${langOf(f)}">${code}</div></details>
</article>`;
}

function flowsHtml() {
  return FLOWS.map((fl) => `<div class="flow" data-owners="${ownersAttr(fl.owners)}">
  <h3>${esc(fl.title)} ${fl.owners.map(badge).join("")}</h3>
  <ol>${fl.steps.map(([p, find, text]) => {
    const ln = lineOf(p, find);
    return `<li><div class="step-text">${text}</div>${lineLink(p, ln, `${esc(path.posix.basename(p))} : ${ln}`)}</li>`;
  }).join("")}</ol></div>`).join("");
}

function membersHtml() {
  const shots = { 1: ["s2-login-light.png", "s3-register-light.png"], 2: ["s4-home-week-light.png", "s4-home-all-light.png"], 3: ["s5-detail-light.png", "s6-form-light.png"] };
  return [1, 2, 3, "s"].map((m) => {
    const isApp = (f) => f.path.startsWith("app/");
    const mine = FILES.filter((f) => f.owners[0] === m);
    const also = FILES.filter((f) => f.owners[0] !== m && f.owners.includes(m));
    const li = (f) => `<li><a href="#${fileId(f.path)}">${esc(f.path)}</a></li>`;
    const list = (title, fs_) => (fs_.length ? `<h4>${title}</h4><ul>${fs_.map(li).join("")}</ul>` : "");
    return `<div class="member m${m}" data-owners="${m}">
  <h3>${badge(m)} ${esc(MEMBERS[m].name)}: ${esc(MEMBERS[m].part)}</h3>
  <p>${esc(MEMBERS[m].desc)}</p>
  <div class="mcols"><div>${list("Flutter app: main files", mine.filter(isApp))}${list("Backend: main files", mine.filter((f) => !isApp(f)))}
  ${list("Also uses (shared with another member)", also)}</div>
  ${shots[m] ? `<div class="shots">${shots[m].map((s) => `<img src="screenshots/${s}" alt="${esc(s)}" loading="lazy">`).join("")}</div>` : ""}</div>
</div>`;
  }).join("");
}

function glossaryHtml() {
  return `<dl class="gloss">${GLOSSARY.map(([term, def, p, find]) => {
    const ln = lineOf(p, find);
    return `<div><dt>${esc(term)}</dt><dd>${def} <span class="ex">Example: ${lineLink(p, ln, `${esc(path.posix.basename(p))} : ${ln}`)}</span></dd></div>`;
  }).join("")}</dl>`;
}

function qaHtml() {
  return [1, 2, 3].map((m) => `<div class="qa" data-owners="${m}"><h3>${badge(m)} ${esc(MEMBERS[m].part)}</h3>
  ${QA[m].map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>`).join("");
}

const apiRoutes = [
  ["POST", "/register", "Create account → token", 1], ["POST", "/login", "Log in → token", 1],
  ["GET", "/tasks?filter=week|all|done", "Task list with days_left, done", 2], ["POST / DELETE", "/tasks/:id/done", "Mark done / not done (for me)", 2],
  ["GET", "/tasks/:id", "One task + done_count, is_owner", 3], ["GET", "/courses", "Course list for the form", 3],
  ["POST", "/tasks", "Add a task", 3], ["PUT", "/tasks/:id", "Edit (creator only)", 3], ["DELETE", "/tasks/:id", "Delete (creator only)", 3],
];

// ---------------------------------------------------------------- page
const groups = [];
for (const m of [1, 2, 3]) {
  groups.push([`${MEMBERS[m].name}: ${MEMBERS[m].part} · Flutter app`, FILES.filter((f) => f.owners[0] === m && f.path.startsWith("app/"))]);
  groups.push([`${MEMBERS[m].name}: ${MEMBERS[m].part} · Backend (api/)`, FILES.filter((f) => f.owners[0] === m && f.path.startsWith("api/"))]);
}
groups.push(["Shared setup", FILES.filter((f) => f.owners[0] === "s")]);
const totalLines = FILES.reduce((s, f) => s + lines[f.path].length, 0);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DueSoon code guide</title>
<style>
:root{--bg:#f7f7fb;--panel:#fff;--text:#1c1b22;--muted:#5d5b6b;--line:#e3e1ec;--accent:#3f51b5;--code:#fbfbfe;--hl:#fff3b0;
--m1:#00796b;--m2:#3f51b5;--m3:#c2410c;--ms:#6b7280;--k:#7c3aed;--s:#0f7b0f;--c:#8a8798;--t:#0b6bcb;--n:#b45309}
@media (prefers-color-scheme:dark){:root{--bg:#121218;--panel:#1b1b23;--text:#e6e4ef;--muted:#a3a0b3;--line:#2e2d3a;--accent:#9fa8ff;--code:#16161d;--hl:#4a3f10;
--m1:#4db6ac;--m2:#9fa8ff;--m3:#fb923c;--ms:#9ca3af;--k:#c4a7ff;--s:#7ee787;--c:#7d7a8c;--t:#79c0ff;--n:#f0b35c}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--text)}
a{color:var(--accent)}code{font:13px ui-monospace,SFMono-Regular,Consolas,monospace;background:var(--code);border:1px solid var(--line);border-radius:4px;padding:0 4px}
.top{position:sticky;top:0;z-index:5;background:var(--panel);border-bottom:1px solid var(--line);padding:10px 20px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center}
.top h1{font-size:17px;margin:0 8px 0 0}.top h1 span{color:var(--muted);font-weight:400}
.filters{display:flex;flex-wrap:wrap;gap:6px}
.filters button{border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:999px;padding:5px 12px;font:inherit;font-size:13px;cursor:pointer}
.filters button[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}
@media (prefers-color-scheme:dark){.filters button[aria-pressed=true]{color:#111}}
.top input{flex:1;min-width:180px;max-width:320px;border:1px solid var(--line);background:var(--bg);color:var(--text);border-radius:8px;padding:6px 10px;font:inherit}
.top .tools button{border:1px solid var(--line);background:none;color:var(--muted);border-radius:8px;padding:5px 10px;font:inherit;font-size:13px;cursor:pointer}
.wrap{display:grid;grid-template-columns:300px 1fr;gap:0;max-width:1500px;margin:0 auto}
nav{position:sticky;top:57px;align-self:start;height:calc(100vh - 57px);overflow:auto;padding:16px 12px 40px 20px;border-right:1px solid var(--line);font-size:13.5px}
nav .toc a{display:block;padding:3px 0;text-decoration:none;color:var(--text)}nav h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:18px 0 6px}
nav ul{list-style:none;margin:0;padding-left:14px}nav>div>ul{padding-left:0}nav summary{cursor:pointer;color:var(--muted)}
.t-file a{text-decoration:none}.t-muted{color:var(--muted)}.t-doc{font-size:12px;color:var(--muted)}
main{padding:24px 32px 120px;min-width:0}
section{margin-bottom:44px}section>h2{font-size:22px;margin:0 0 6px;scroll-margin-top:70px}.lead{color:var(--muted);margin-top:0;max-width:75ch}
.badge{display:inline-block;font-size:11px;font-weight:600;border-radius:4px;padding:0 6px;margin-left:3px;color:#fff;vertical-align:1px}
.badge.m1{background:var(--m1)}.badge.m2{background:var(--m2)}.badge.m3{background:var(--m3)}.badge.ms{background:var(--ms)}.badge.mt{background:none;border:1px solid var(--line);color:var(--muted)}
@media (prefers-color-scheme:dark){.badge.m1,.badge.m2,.badge.m3,.badge.ms{color:#111}}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px}.card h3{margin:0 0 6px;font-size:15px}.card p{margin:0;color:var(--muted);font-size:14px}
.arch{display:flex;flex-wrap:wrap;align-items:stretch;gap:0;margin:14px 0}
.arch .box{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:150px;flex:1}
.arch .box b{display:block}.arch .box small{color:var(--muted)}.arch .arrow{align-self:center;padding:0 8px;color:var(--muted);font-size:13px;text-align:center}
.screens{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.screens .sc{background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--ms);border-radius:8px;padding:8px 12px;font-size:14px}
.screens .sc.m1{border-left-color:var(--m1)}.screens .sc.m2{border-left-color:var(--m2)}.screens .sc.m3{border-left-color:var(--m3)}.screens .to{color:var(--muted)}
.member{background:var(--panel);border:1px solid var(--line);border-left:5px solid var(--ms);border-radius:10px;padding:14px 18px;margin-bottom:14px}
.member.m1{border-left-color:var(--m1)}.member.m2{border-left-color:var(--m2)}.member.m3{border-left-color:var(--m3)}
.member h3{margin:0 0 4px}.member h4{margin:10px 0 4px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.member ul{margin:0;padding-left:18px;font-size:14px}
.mcols{display:flex;flex-wrap:wrap;gap:20px}.mcols>div:first-child{flex:1;min-width:260px}.shots{display:flex;gap:10px}.shots img{width:150px;border-radius:10px;border:1px solid var(--line)}
.flow{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px;margin-bottom:14px}.flow h3{margin:4px 0 8px;font-size:16px}
.flow ol{margin:0;padding-left:22px}.flow li{padding:4px 0;border-bottom:1px dashed var(--line);display:flex;gap:12px;justify-content:space-between;align-items:baseline}.flow li:last-child{border:0}
.flow li::marker{color:var(--muted)}.flow .ln-link{font:12.5px ui-monospace,Consolas,monospace;white-space:nowrap}
.file{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 18px;margin-bottom:16px;scroll-margin-top:70px}
.file header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px}.fpath{font:14px ui-monospace,Consolas,monospace;word-break:break-all}.fpath .dir{color:var(--muted)}
.fmeta{display:flex;align-items:center;gap:6px}.lines{font-size:12px;color:var(--muted)}.copy{font-size:12px;border:1px solid var(--line);background:none;color:var(--muted);border-radius:6px;padding:1px 8px;cursor:pointer}
.what{margin:8px 0}.keys{margin:0 0 8px;padding-left:0;list-style:none;font-size:14px}.keys li{padding:2px 0;display:flex;gap:10px}
.keys .ln-link{font:12.5px ui-monospace,Consolas,monospace;min-width:62px;white-space:nowrap}
details.code>summary{cursor:pointer;color:var(--accent);font-size:14px;margin:4px 0}
.codebox{background:var(--code);border:1px solid var(--line);border-radius:8px;overflow:auto;max-height:620px;font:12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;padding:6px 0}
.cl{display:flex;white-space:pre;min-width:max-content}.cn{flex:none;width:46px;text-align:right;padding-right:12px;color:var(--c);user-select:none}.cc{padding-right:16px}
.cl.flash{background:var(--hl)}.k{color:var(--k)}.s{color:var(--s)}.c{color:var(--c);font-style:italic}.t{color:var(--t)}.n{color:var(--n)}
.gloss{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:10px;margin:0}.gloss>div{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.gloss dt{font-weight:600}.gloss dd{margin:2px 0 0;font-size:14px}.gloss .ex{display:block;color:var(--muted);font-size:12.5px;margin-top:4px}
.qa{margin-bottom:14px}.qa h3{font-size:16px;margin:0 0 6px}.qa details{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin-bottom:6px}
.qa summary{cursor:pointer}.qa p{margin:8px 0 2px;color:var(--muted)}
table{border-collapse:collapse;width:100%;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:14px}
th,td{text-align:left;padding:7px 12px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-weight:600;font-size:13px}td code{white-space:nowrap}
.hidden{display:none!important}.dim{opacity:.35}
.howto{background:var(--panel);border:1px dashed var(--line);border-radius:10px;padding:10px 16px;font-size:14px}
.group-title{font-size:15px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:26px 0 10px}
@media (max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}main{padding:18px}}
@media print{.top,nav{display:none}.wrap{display:block}details.code{display:none}}
</style></head><body>
<div class="top">
  <h1>DueSoon <span>code guide</span></h1>
  <div class="filters" role="group" aria-label="Show">
    <button data-f="all" aria-pressed="true">Whole project</button>
    <button data-f="1">M1 · ${esc(MEMBERS[1].part)}</button>
    <button data-f="2">M2 · ${esc(MEMBERS[2].part)}</button>
    <button data-f="3">M3 · ${esc(MEMBERS[3].part)}</button>
    <button data-f="s">Shared</button>
  </div>
  <input id="q" type="search" placeholder="Search files (e.g. login, Checkbox)…" aria-label="Search files">
  <div class="tools"><button id="openall">Open all code</button></div>
</div>
<div class="wrap">
<nav>
  <div class="toc"><h2>Sections</h2>
    <a href="#start">Start here</a><a href="#big">How it fits together</a><a href="#members">Who owns what</a><a href="#flows">Step-by-step flows</a>
    <a href="#files">Every file + code</a><a href="#api">API routes</a><a href="#gloss">Flutter + backend words</a><a href="#qa">Practice questions</a></div>
  <div><h2>Project folder</h2>${tree()}</div>
</nav>
<main>
<section id="start"><h2>Start here</h2>
<p class="lead">DueSoon is a shared deadline board for one class: anyone adds an assignment, quiz or exam, everyone sees it sorted by due date, each student ticks off their own work and sees how many classmates finished.
This page explains every part of the code. Each member owns one feature <b>from the screen to the database</b>: their Flutter screens and the server code behind them. Pick your part with the buttons at the top, or keep <b>Whole project</b>.</p>
<div class="howto"><b>How to use this page.</b> Every file shows its path exactly as in the project folder (open it in VS Code with <code>Ctrl+P</code> and type the file name).
Blue <b>line N</b> links jump to that line in the code below and highlight it. Read the <a href="#flows">flows</a> first: they follow one action (e.g. logging in) through the files in order.
Generated from the real source (${FILES.length} files, ${totalLines} lines) on ${new Date().toISOString().slice(0, 10)} by <code>node docs/tools/build-code-guide.js</code>.</div>
</section>

<section id="big"><h2>How it fits together</h2>
<p class="lead">The Flutter app never touches the database. It sends HTTP requests to our Express API, which checks the login token and the rules, reads/writes the database, and answers with JSON.</p>
<div class="arch">
  <div class="box"><b>Screens</b><small>app/lib/screens/ · widgets/</small><br><small>what the user sees</small></div>
  <div class="arrow">call<br>→</div>
  <div class="box"><b>ApiService</b><small>app/lib/services/api_service.dart</small><br><small>HTTP + JSON + token</small></div>
  <div class="arrow">HTTPS JSON<br>→</div>
  <div class="box"><b>Express API</b><small>api/src/ (on Vercel)</small><br><small>login check, rules</small></div>
  <div class="arrow">Prisma<br>→</div>
  <div class="box"><b>Postgres</b><small>Neon cloud database</small><br><small>users, tasks, task_done</small></div>
</div>
<h3>Screens and who owns them</h3>
<div class="screens">
  <span class="sc m1">S1 Splash</span><span class="to">→</span><span class="sc m1">S2 Login</span><span class="to">↔</span><span class="sc m1">S3 Register</span><span class="to">→</span>
  <span class="sc m2">S4 Home · This Week / All / Done</span><span class="to">→</span><span class="sc m3">S5 Task detail</span><span class="to">↔</span><span class="sc m3">S6 Add / Edit form</span>
</div>
<div class="cards" style="margin-top:14px">
  <div class="card"><h3>Login token</h3><p>After login the server gives a token. <code>Session</code> keeps it; <code>ApiService</code> sends it with every request so the server knows who you are.</p></div>
  <div class="card"><h3>Server is the rule</h3><p>The app checks forms to give quick messages, but the server checks everything again (past dates, who may edit).</p></div>
  <div class="card"><h3>days_left comes from the server</h3><p>"Today" is the Bangkok date on the server, so every phone shows the same "2 days left". The app only picks colors and words.</p></div>
  <div class="card"><h3>Prisma instead of mysql2</h3><p>Class used Express + mysql2 + MySQL (TiDB). We use Express + <b>Prisma</b> + Postgres (Neon): Prisma writes the SQL for us. Routes, REST and JSON work the same way.</p></div>
  <div class="card"><h3>Refresh after changes</h3><p>A screen that changed something closes with <code>Navigator.pop(context, true)</code>; the screen below reloads its list.</p></div>
</div>
</section>

<section id="members"><h2>Who owns what</h2><p class="lead">Same split as <code>docs/TEAM.md</code>: each member owns their screens <b>and</b> the API routes and database code behind them. "Also uses" = files shared with another member.</p>${membersHtml()}</section>

<section id="flows"><h2>Step-by-step flows</h2><p class="lead">Each flow follows one user action through the code, in order. Click a <code>file : line</code> link to see that exact line.</p>${flowsHtml()}</section>

<section id="files"><h2>Every file + code</h2><p class="lead">What each file does, its important lines, and the full code (click <b>Show code</b>). Files are grouped by their <b>main</b> owner; with a member button on, you also see the files that member shares with others under the other member's heading.</p>
${groups.map(([title, fs_]) => `<div class="fgroup" data-owners="${ownersAttr([...new Set(fs_.flatMap((f) => f.owners))])}"><h3 class="group-title">${esc(title)}</h3>${fs_.map(fileCard).join("")}</div>`).join("")}
<div class="file" data-owners="s" data-search="tests test flutter test"><header><div class="fpath"><b>Tests</b></div></header><p class="what">Automatic checks (not needed for the presentation): ${TESTS.map((t) => `<code>${esc(t)}</code>`).join(" ")}. Run with <code>flutter test</code> in <code>app/</code>.</p></div>
</section>

<section id="api"><h2>API routes the app calls</h2><p class="lead">Base URL <code>https://duesoon-api.vercel.app</code>. All except register/login need the token. Full details: <code>docs/SPEC.md</code> §4.</p>
<table><thead><tr><th>Method</th><th>Path</th><th>What it does</th><th>Used by</th></tr></thead><tbody>
${apiRoutes.map(([m, p, w, o]) => `<tr data-owners="${o} s"><td><code>${esc(m)}</code></td><td><code>${esc(p)}</code></td><td>${esc(w)}</td><td>${badge(o)}</td></tr>`).join("")}
</tbody></table></section>

<section id="gloss"><h2>Flutter + backend words used in this project</h2><p class="lead">Each one links to a real example in our code.</p>${glossaryHtml()}</section>

<section id="qa"><h2>Practice questions</h2><p class="lead">Questions a teacher might ask about each part. Try to answer before opening.</p>${qaHtml()}</section>
</main></div>
<script>
(function(){
  const btns=[...document.querySelectorAll('.filters button')], q=document.getElementById('q');
  let filter=new URLSearchParams(location.search).get('member')||'all';
  function apply(){
    btns.forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===filter));
    const term=q.value.trim().toLowerCase();
    document.querySelectorAll('[data-owners]').forEach(el=>{
      const own=el.dataset.owners.split(' ');
      let show=filter==='all'||own.includes(filter);
      if(show&&term&&el.classList.contains('file')&&el.dataset.search) show=el.dataset.search.includes(term)||el.textContent.toLowerCase().includes(term);
      if(el.classList.contains('t-file')) el.classList.toggle('dim',!show); else el.classList.toggle('hidden',!show);
    });
    document.querySelectorAll('.fgroup').forEach(g=>{ if(!g.classList.contains('hidden')) g.classList.toggle('hidden',!g.querySelector('.file:not(.hidden)')); });
    const u=new URL(location); filter==='all'?u.searchParams.delete('member'):u.searchParams.set('member',filter); history.replaceState(null,'',u);
  }
  btns.forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.f;apply();}));
  q.addEventListener('input',()=>{apply(); if(q.value.trim()) document.getElementById('files').scrollIntoView();});
  document.addEventListener('click',e=>{
    const a=e.target.closest('.ln-link'); if(a){ e.preventDefault(); const card=document.getElementById(a.dataset.file);
      if(card&&card.classList.contains('hidden')){filter='all';apply();}
      const det=card.querySelector('details.code'); det.open=true;
      const line=document.getElementById(a.dataset.file+'-L'+a.dataset.line);
      document.querySelectorAll('.cl.flash').forEach(x=>x.classList.remove('flash'));
      line.classList.add('flash'); card.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{const box=line.closest('.codebox'); box.scrollTop=line.offsetTop-box.clientHeight/3;},350);
      history.replaceState(null,'','#'+line.id); return; }
    const c=e.target.closest('.copy'); if(c){ navigator.clipboard&&navigator.clipboard.writeText(c.dataset.path); c.textContent='copied'; setTimeout(()=>c.textContent='copy path',1200); }
  });
  let open=false; document.getElementById('openall').addEventListener('click',e=>{open=!open;document.querySelectorAll('details.code').forEach(d=>{if(!d.closest('.hidden'))d.open=open});e.target.textContent=open?'Close all code':'Open all code';});
  apply();
  if(location.hash){const el=document.getElementById(location.hash.slice(1)); if(el&&el.classList.contains('cl')){el.closest('details').open=true;el.classList.add('flash');setTimeout(()=>el.scrollIntoView({block:'center'}),50);}}
})();
</script>
</body></html>`;

fs.writeFileSync(OUT, html);
console.log(`wrote ${path.relative(ROOT, OUT)}: ${FILES.length} files, ${totalLines} lines of code, ${(html.length / 1024).toFixed(0)} KB`);

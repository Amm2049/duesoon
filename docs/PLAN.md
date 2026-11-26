# DueSoon: Build plan

Build steps in order, no dates; finish ASAP (D-28). Each step ends in something demoable and verified. Only the **next** step is broken into tasks; later steps are expanded when we reach them. Details live in `SPEC.md`.

## Step 0: Project kit ✅
- [x] `docs/SPEC.md`, `docs/PLAN.md`, `docs/PROGRESS.md`, `CLAUDE.md`
- [x] Owner answered O-01 (CSC452 only), O-02 (no schedule); no git (D-26)
- [x] Owner chose Prisma (D-30) and UI style (D-31, D-32)
- [x] Tool versions checked against official docs + npm (SPEC §12); Prisma 7 + CommonJS spike passed
- [ ] Owner reviews the [Default] decisions in SPEC §2
- [x] Owner upgrades **Node.js to 24 LTS** (nodejs.org installer), then `node -v` → v24.22.3
- [x] Owner runs **`flutter upgrade`** → 3.50.1 (Dart 3.14.0), `flutter doctor` no issues

## Step 1: Database with Prisma ✅
- [x] `api/` set up: `"type": "commonjs"`, `engines.node "24.x"`; express@5, cors, dotenv, jsonwebtoken, bcryptjs, prisma@7, @prisma/client@7 installed; `npm audit` 0 (effect override, D-38)
- [x] Switched TiDB → **Neon** (D-39): `@prisma/adapter-pg@7` + `pg`, provider `postgresql`, pooled/direct URLs (D-38); `prisma validate` + generate + client load OK
- [x] `.env.example`, `.vercelignore`, `prisma.config.js`, `src/db.js`
- [x] `src/lib/dates.js` + `test/dates.test.js`: 9/9 pass (Bangkok midnight boundaries, fake dates, month/year rollover, negative/zero/positive days)
- [x] `prisma/seed.js` (re-runnable, relative dates, 4 users, 10 tasks, done counts 3/1/1) and `scripts/check-db.js` (`npm run db:check`)
- [x] **Owner:** Neon project created, `.env` filled (fixed: URLs had Neon's `psql '…'` wrapper; recreated `.env.example`)
- [x] `npx prisma db push` → tables `courses, task_done, tasks, users` exist in Neon
- [x] `npx prisma db seed` → 1 course, 4 users, 10 tasks
- [x] `npm run db:check`: `days_left` = −2, −1, 0, 1, 2, 5, 7, 9, 14, 20 ✔; Mai done only Lab 5 ✔; counts 3/1/0/0/1/0… ✔
- [x] Stored `due_date::text` in DB matches script output (no off-by-one) ✔; `sslmode=verify-full` on app URL (SSL warning gone)
- [ ] (Owner, optional) `PRISMA_LOG=1 npm run db:check` → screenshot the `LEFT JOIN … COUNT(*)` query for slides
- [x] Logged in PROGRESS: "Database ready"

## Step 2: API: setup + auth ✅
- [x] `src/index.js` (exports app: cors, JSON 100 kB, health, JSON 404, error handler) + `src/dev.js` (listen)
- [x] `lib/validate.js` (register, login, task, `:id`) + `lib/token.js` (HS256, 7 days) + `middleware/auth.js`
- [x] `repos/users.js`, `routes/auth.js`: `POST /register`, `POST /login`, `GET /me` (D-40)
- [x] Unit tests: **31/31** pass (`npm test`): name/title/password/email/date/description boundaries, 72-byte Thai passwords, expired/forged/`alg:none` tokens
- [x] API tests vs Neon: **11/11** pass (`npm run test:api`): 201/409/400 register, same 401 for wrong pw + unknown email, bcrypt hash stored, /me 401 cases, bad JSON 400, JSON 404; test users cleaned up (0 left)
- [x] Real dev server checked with curl: health, Mai login, /me, wrong password 401, CORS header

## Step 3: API: courses, tasks, done ✅
- [x] `repos/courses.js`, `repos/tasks.js` (JSON shapes, filters, detail with `_count`, upsert done, cascade delete)
- [x] `routes/courses.js`, `routes/tasks.js`: all §4.2 endpoints; 404 → 403 → 400 order; creator from token only
- [x] API tests `test-api/tasks.api.js` (shared `helpers.js` with FK-safe cleanup): **25/25** total pass, including week boundary +7/+8, overdue, per-user done, idempotent done, done-tab order, edit keeps done, 403s, 404s, cascade
- [x] Seeded data intact afterwards (4 users, 10 tasks, 5 done rows); curl as Mai: This Week / Done / detail correct
- [x] SPEC §9 API checklist ticked

## Step 4: Deploy API to Vercel ✅
- [x] **Owner:** install Node 24 LTS (`node -v` → v24.22.3), then in `api/`: `npm install` (refresh, audit 0, no EBADENGINE), `npm test` 31/31 green
- [x] **Owner:** `vercel login` (CLI 67 uses a device code: open the printed link, approve; works from Claude too) → `vercel whoami` OK
- [x] Claude: O-07 resolved (24.x supported, `engines` wins); `prisma` in `dependencies` + `postinstall` ✔; build runs `prisma generate` OK
- [x] `vercel link --yes --project duesoon-api`; `.vercelignore` now also drops `.env*.local` (link wrote an OIDC token there)
- [x] Env vars (Production + Preview, Secret): `DATABASE_URL` (pooled, verify-full), new random `JWT_SECRET` (D-42)
- [x] Deployed → `https://duesoon-api.vercel.app` (first deploy auto-goes to production; later `vercel` = preview, `vercel --prod` = production)
- [x] Verify live: `GET /` 200; Mai login + `/me`; wrong pw 401; no token 401; week = 6 tasks, days_left −1…7, Lab 5 (done) excluded; CORS `*`; JSON 404; runtime error logs 0
- [ ] Run API test suite against the live URL (add `API_BASE` option to helpers) — optional, the curl check above covers the checklist
- [x] Live URL recorded in SPEC §4.1 (D-42); `app/lib/config.dart` gets it in Step 5

## Step 5: Flutter: foundation + auth screens ✅
**5a. Project**
- [x] `flutter create` in `app/` (project name `duesoon`, org `com.duesoon`, android + web (D-43)), confirm template already imports `material_ui` (D-36); `flutter pub add http` (+ `material_ui` if missing)
- [x] Delete counter demo + its test; `flutter analyze` clean, `flutter test` green on the empty app

**5b. Foundation (no UI yet)**
- [x] `lib/config.dart`: `apiBase` from `--dart-define=API_BASE`, default `https://duesoon-api.vercel.app`
- [x] `models/user.dart` (`fromJson`); `course.dart`, `task.dart` shells for Step 6 (only fields from §4.2)
- [x] `services/session.dart`: in-memory token + user, `clear()` (D-10)
- [x] `services/api_service.dart`: one `http.Client` (injectable for tests), JSON + `Authorization` header, `ApiException(status, message)` from `{error}`; `register`, `login`, `me`; 10 s timeout → network error
- [x] `utils/validators.dart`: name / email / password / confirm mirroring §4.4 (password limit = **72 UTF-8 bytes**, same as server)

**5c. Screens**
- [x] `main.dart`: indigo M3 light + dark, `ThemeMode.system` (§6.1); home = Splash
- [x] S1 Splash (~2 s, indigo, `pushReplacement` → Login)
- [x] S2 Login (validators, spinner on `FilledButton`, 401 → "Invalid email or password", network → "Something went wrong…", → Register link, success → Home placeholder)
- [x] S3 Register (+ confirm password, 409 → "Email already registered", success → Home placeholder)
- [x] Temporary Home placeholder ("Hi, Mai" + logout) so the flow is testable; replaced in Step 6

**5d. Verify**
- [x] Unit tests: validators boundaries (50/51 name, 5/6 + 72/73-byte password incl. Thai), `User.fromJson`, `ApiService` with `MockClient` (`package:http/testing.dart`, ships inside `http`, no new package): 200, 401, 409, timeout/non-JSON
- [x] Widget test: Login shows errors for empty/bad email; doesn't call the API when invalid
- [x] `flutter analyze` 0 issues; run on emulator against live API: login Mai, wrong pw, register new `apitest-app1` user (then cleaned up), light + dark screenshot of Login
- [x] Result: analyze 0 issues; **27 tests** pass; emulator vs live API: wrong pw SnackBar, Mai → "Hi, Mai", confirm mismatch caught, register OK, uppercase duplicate → "Email already registered", dark mode readable. Android build needed D-44 (NDK). Splash not screenshotted (only seen passing to Login)

## Step 6: Flutter: Home tabs + grouped list ✅
**6a. Rules (pure Dart, tested first)**
- [x] `utils/urgency.dart`: `urgencyOf(daysLeft, done)` → done/overdue (<0)/soon (0–2)/later (≥3); `urgencyColor(u, brightness, colorScheme)` (§6.1 light + dark set, done = `outline`); `groupOf(daysLeft)` → Overdue/Today/Tomorrow/This week (2–7)/Later (>7); `dueLabel(daysLeft)` → "3 days overdue" / "1 day overdue" / "Due today" / "Tomorrow" / "In n days"
- [x] `utils/date_format.dart`: `"2026-11-28"` → `"Sat 28 Nov"` (no `intl`, D-25; parsed as UTC date so no time zone shift)
- [x] `widgets/grouped_task_list.dart` builder: tasks (already sorted by API) → flat list of header/task items; header only when the group has tasks, groups in fixed order

**6b. API + errors**
- [x] `ApiService.getTasks(filter)` → `List<Task>`; `setDone(id, done)` → POST/DELETE `/tasks/:id/done`
- [x] `utils/api_errors.dart` `showApiError(context, e)`: **401 → clear Session, back to Login + "Session expired, please log in again"**; else SnackBar "Something went wrong. Pull to retry." (§6)

**6c. Widgets + Home**
- [x] `task_card.dart` (Card + 4 px urgency strip, title, type `Chip`, subtitle "CSC452 · Due today" in urgency color, trailing `Checkbox`; done = grey strip + strikethrough), `group_header.dart`, `empty_state.dart` (§6.1 icons/texts)
- [x] `home_screen.dart`: `DefaultTabController` This Week / All / Done, logout in AppBar; each tab = `TaskListTab(filter)` that loads its own data (setState, D-9), spinner on first load, `RefreshIndicator`; Done tab flat (API order); tabs reload when shown again
- [x] Checkbox: wait for server, then reload (D-46); per-task lock so double-taps don't send twice
- [x] Card tap + FAB **not wired yet** (S5/S6 are Step 7)

**6d. Verify**
- [x] Unit tests: urgency/group/label boundaries (−1/0/1/2/3, 7/8), colors differ light vs dark, date format (month/year edges), grouping (empty groups hidden, order)
- [x] Widget tests with `MockClient`: This Week shows headers + cards; empty state per tab; checkbox sends POST then reloads; 401 → Login with "Session expired"
- [x] `flutter analyze` 0; emulator vs live API as Mai: compare to `curl` week list (6 tasks, −1…7), tick + untick a task (then restore), light + dark screenshots of This Week (SPEC §6.1 check)
- [x] Result: analyze 0; **43 tests** pass. Emulator vs live API as Mai: This Week = curl list exactly (6 tasks, 4 groups, labels/colors right); tick Quiz 3 → leaves This Week, top of Done; untick restores (live data back to seed state). Found + fixed: 2-line title clipped the subtitle (ListTile) → custom card + regression test. Light + dark screenshots OK. Open: O-08 (2-day color)

## Step 7: Flutter: detail + add/edit/delete ✅
**7a. API + rules**
- [x] `ApiService`: `getTask(id)`, `getCourses()`, `createTask(input)`, `updateTask(id, input)`, `deleteTask(id)` (204), `setDone` returns `done_count`
- [x] `utils/validators.dart`: title (1–100 after trim), description (≤ 1000), due date window: create `today…today+365`, edit `…today+365` (D-19), mirroring `validateTask`
- [x] `utils/dates.dart` `todayForPicker()`: Bangkok date, same as the API (D-47)
- [x] `doneCountText(n)` (D-20): 0 → "Nobody has finished this yet", 1 → "1 classmate finished this", n → "n classmates finished this"

**7b. S5 Task detail** (`screens/task_detail_screen.dart`)
- [x] Loads `GET /tasks/:id`; title, type chip, rows: 📅 "Sat 28 Nov · Tomorrow" (urgency color), 📘 "CSC452 Mobile Programming", 👤 "Added by Mai"; description (or "No description"); done count line
- [x] Full-width **Mark as done / Mark as not done** (waits for server like D-46, updates count)
- [x] Owner only: Edit (AppBar icon → S6 pre-filled) + Delete (confirm dialog → DELETE → pop `true`); **404** → SnackBar "This task was deleted" + pop `true`; **403** → server message
- [x] Pops with `true` whenever something changed (done toggled, edited, deleted) → Home tab reloads

**7c. S6 Add / Edit form** (`screens/task_form_screen.dart`)
- [x] Title, course `DropdownButtonFormField` (from `/courses`, CSC452 pre-selected), type `SegmentedButton` (Assignment / Quiz / Exam), due date via `showDatePicker` (create: first = today; edit: first = min(today, current due) so an overdue task can still be edited; last = today+365), description multiline (counter 1000)
- [x] Save (spinner) → POST / PUT → pop `true`; 400 → server message SnackBar; 403/404 → message + pop
- [x] Home: FAB **+** → S6 (create); card tap → S5; reload the tab when either returns `true`

**7d. Verify**
- [x] Unit: title/description/date-window boundaries (yesterday no on create but yes on edit, today+365 yes, +366 no), `doneCountText`, new `ApiService` calls with `MockClient` (204 delete, 403, 404)
- [x] Widget: detail shows owner buttons only when `is_owner`; delete asks before calling the API; form blocks empty title + shows server 400
- [x] `flutter analyze` 0; emulator vs live API: as Mai create `apitest`-style task → appears in This Week → edit → mark done (count goes up) → delete; as Ploy open Mai's task: no Edit/Delete, done count shared; light + dark screenshots of S5 (SPEC §9); clean up test tasks
- [x] Result: analyze 0; **63 tests** pass. Emulator vs live API: Mai added "Step 7 check" quiz (picker starts at today, past greyed) → in THIS WEEK → detail with Edit/Delete → Mark as done (count 0→1) → edit title (done kept, D-18); Ploy: same count, own done = false, no Edit/Delete; Mai viewing Ploy's Quiz 2: no Edit/Delete; delete with confirm → gone from list + server (10 tasks, Mai week/done back to seed). Light + dark S5 OK. Fixed: "Assignment" wrapped in type buttons → text-only segments

## Step 8: Polish + demo prep ✅
**8a. Polish**
- [x] App icon: hand-made adaptive vector + PNG/web icons (D-48); Android label already "DueSoon"; web `index.html`/`manifest.json` still say "duesoon" / "A new Flutter project" → fix
- [x] O-03 persistent login: keep in memory (D-10)
- [x] Review pass over `app/lib` + `api/src` (dead code, TODOs, leftover "Step N" comments, error texts match SPEC §6)

**8b. Full SPEC §9 re-run (fresh, in one go)**
- [x] `npm test` + `npm run test:api` (api/; touches live DB, cleans `apitest-*`), `flutter analyze` + `flutter test` (app/)
- [x] Emulator walkthrough of every §9 App item vs live API; fresh light + dark screenshots of S1–S6 into `docs/screenshots/` (for README + slides)
- [x] Re-seed check: `db:check` output still matches (no leftovers from tests)

**8c. Demo**
- [x] O-04 demo device: emulator + APK backup (+ `flutter build apk --release` if a phone is used)
- [x] `docs/DEMO.md`: 5-minute script with two accounts (Mai + Ploy) showing per-user done, shared count, owner-only edit/delete, 401/validation, dark mode; backup plan if Wi-Fi/Neon is slow (first request wakes Neon)
- [x] ~~Prisma SQL log for slides~~ dropped: no slides: `PRISMA_LOG=1 npm run db:check` → save the `LEFT JOIN … COUNT` query text (owner takes the terminal screenshot if wanted)

**8d. Docs + slides**
- [x] `README.md` (what it is, screenshots, stack + why, how to run api/app, demo accounts, live URL, tests, folder layout)
- [x] ~~Presentation slides~~ owner: not needed (problem → demo → architecture → key decisions: JWT, Bangkok "today", Prisma/Neon switch, server-is-the-rule → testing → what I'd do next)
- [x] Result: api `npm test` 31/31, `test:api` 25/25, `db:check` = seed (10 tasks, counts 3/1/1); app analyze 0, **64 tests**. Release APK 48.9 MB installed on emulator: new icon in drawer + system splash; 14 fresh screenshots S1–S6 light/dark vs live API. Review found + fixed: unexpected reply shape could leave a spinner forever → `_parse()` wraps it as ApiException (+ test). Web title/manifest/theme → DueSoon/indigo

## Step 9 (optional): Flutter web on Vercel (D-29) ✅
- [x] `flutter build web`; no `dart:io` in `lib/`; live API answers CORS preflight (OPTIONS 204, `allow-origin: *`)
- [x] Vercel project `duesoon-web` linked in `app/build/web/`, `.vercelignore` keeps the OIDC `.env.local` out → https://duesoon-web-phi.vercel.app (first deploy went straight to production, as with the API). Checked: `.env.local`, `.vercel/`, `*.map` all 404
- [x] Web check in headless Chrome via DevTools protocol (Claude in Chrome not connected): Mai login, all 3 tabs, done toggle + undo, add (picker) / edit / delete own task; Ploy on Ton's task: no Edit/Delete. Network log: every call OPTIONS 204 → 200, **no CORS/console errors**. Live data back to seed (10 tasks, Mai week 2–7, done 1)
- [x] Found + fixed: type chip announced as a checkbox to screen readers → `TypeChip` (plain-text semantics) + regression test (proved it fails without the fix). 65 tests, analyze 0. Web redeployed, APK rebuilt
- [x] README link (no slides, D-48)

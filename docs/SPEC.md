# DueSoon: Specification

> Single source of truth for building DueSoon. If this file disagrees with any other doc or design, **this file wins**.
> Status tags: **[Decided]** = agreed with the owner · **[Default]** = Claude's proposal, accepted unless challenged · **[Open]** = needs an answer.

---

## 1. Product

**One-liner:** one shared deadline board for the class. Anyone adds an assignment/exam/quiz once; everyone sees it; each person ticks off their own progress.

**Who:** classmates in the CSC452 class/section.

**Problem:** deadlines get lost in group-chat scroll; everyone keeps their own list.

**Course context:** CSC452 Mobile Programming final project. Demonstrates Tabs, StatefulWidget forms + validation, navigation by id, ListView + ListTile, full CRUD, Express + **Neon Postgres** on Vercel. "Beyond the labs" pieces to highlight in the presentation: **Prisma ORM** (with query logging to show the SQL it generates: **LEFT JOIN + COUNT(*) + GROUP BY** for done counts, and the two-query `WHERE … IN (…)` pattern it uses for relations), **JWT login**, **bcrypt password hashing**, **Material 3 theming with dark mode**.

### 1.1 User stories
| ID | As a… | I want to… | so that… |
|---|---|---|---|
| US-1 | new user | register with name, email, password | I have my own done/not-done status |
| US-2 | user | log in | I see my own progress |
| US-3 | user | see unfinished tasks due soon, grouped by day, colored by urgency | I know what to do next |
| US-4 | user | add a task (title, course, type, due date, description) | classmates don't have to type it again |
| US-5 | user | mark a task done / not done | it leaves my to-do list (only for me) |
| US-6 | user | see my finished tasks in a Done tab | I can review or undo |
| US-7 | user | see how many classmates finished a task | I get a social nudge |
| US-8 | task creator | edit or delete my task | I can fix mistakes |
| US-9 | user | browse all tasks | I can plan beyond this week |

### 1.2 Non-goals (explicitly out of scope)
Push notifications · multiple groups / join codes · adding/editing courses in the app · password reset · profile editing · admin role · offline mode · file attachments · comments.

---

## 2. Decision log

| ID | Decision | Status | Why / notes |
|---|---|---|---|
| D-01 | App name **DueSoon** | [Decided] | Folder already named `duesoon`. |
| D-02 | **One shared board** for one class; no groups/join codes | [Decided] | Simplest; groups add a table + a whole flow. |
| D-03 | Courses are a **fixed seeded list**; no course CRUD in app | [Decided] | Keeps scope small. |
| D-04 | **Solo project**; docs (SPEC/PLAN/PROGRESS/CLAUDE.md) live in the project folder | [Decided] | |
| D-05 | **One project folder, organized subfolders**: `app/` (Flutter), `api/` (Express), `docs/` | [Decided] | Docs next to both. See §8. |
| D-06 | Auth = **JWT**. Login/register return a token; app sends `Authorization: Bearer <token>`; server takes the user id **only from the token**, never from body/query | [Decided] | `?user_id=` could be faked, which would make the creator-only rule meaningless. |
| D-07 | Passwords hashed with **bcryptjs** (cost 10); `passwordHash` never returned by any endpoint | [Default] | bcryptjs is pure JS, so it deploys to Vercel with no native build step. |
| D-08 | Packages. API: Express, cors, dotenv (course) + **Prisma** (D-30/D-34) + `jsonwebtoken`, `bcryptjs` (D-06/D-07). Flutter: **http**, **material_ui** (D-36), plus built-in widgets. Versions: §12 | [Decided] | Owner's known tools + what the decisions need. Anything else must be asked first. |
| D-09 | State management: **setState only**; each screen loads its own data | [Default] | Matches the course; app is small. |
| D-10 | **No persistent login**: token kept in memory (`Session` class). Splash → Login every app start | [Decided] | Avoids a new package. Upgrade path: O-03. |
| D-11 | "This Week" tab = **not done AND (overdue OR due within 7 days of today)** | [Decided] | Overdue work stays visible in red until done. |
| D-12 | **"Today" = Asia/Bangkok date (UTC+7)**, computed in the API by `todayBangkok(now)`. Never use the server clock's date or SQL `CURDATE()`/`NOW()` for rules | [Default] | Neon and Vercel run on UTC, so from 00:00 to 07:00 Bangkok time the UTC date is still yesterday. |
| D-13 | *(revised for Prisma)* `dueDate` is a `DATE` column (`@db.Date`). Prisma returns it as a JS `Date` at UTC midnight, so **all conversion happens in `lib/dates.js`**: `toDateStr(date)` → `"YYYY-MM-DD"` going out, `fromDateStr(str)` → `new Date(str + "T00:00:00Z")` going in. API JSON always carries `"YYYY-MM-DD"` strings | [Default] | One place for date conversion means no off-by-one-day bugs scattered through the code. |
| D-14 | Urgency (by `days_left = due_date − today`): **overdue** < 0 (red), **soon** 0–2 (orange), **later** ≥ 3 (green); done tasks grey | [Decided] | Same thresholds on API and app; see §5. |
| D-15 | Only the **creator** may edit/delete a task; enforced on the server (404 if missing, 403 if not owner). App hides the buttons for non-owners | [Decided] | Server is the rule; the UI just follows. |
| D-16 | *(revised for Prisma)* Marking done is **idempotent**: `prisma.taskDone.upsert` on the compound key `(userId, taskId)`; undo = `deleteMany` (no error if already undone) | [Default] | Double-tap is harmless. |
| D-17 | Deleting a task deletes its done rows (`onDelete: Cascade` in schema) | [Default] | No orphan rows. |
| D-18 | Editing a task (including its due date) **keeps** everyone's done status | [Default] | Simple; rare case. |
| D-19 | Due date on **create** must be ≥ today (Bangkok); on **edit** any valid date; both ≤ today + 365 | [Default] | Lets the creator fix the description of an overdue task. |
| D-20 | Done count shows **everyone who finished, including me**: "12 classmates finished this" / "Nobody has finished this yet" | [Default] | One count, no special cases. |
| D-21 | *(revised for Prisma)* Seed via **`prisma/seed.js`**; task dates relative to `todayBangkok()` (e.g. today − 2 … today + 20); demo passwords hashed in the script | [Default] | The demo looks alive whatever day you present. |
| D-22 | Tests: API rules with **Node's built-in test runner** (`node --test`, no install); Flutter helpers with built-in `flutter_test`; endpoints verified with the manual checklist in §9 | [Default] | Tests the boundary rules (urgency, dates, validation) without new tools. |
| D-23 | Secrets (`DATABASE_URL`, `JWT_SECRET`) only in `api/.env` and Vercel env vars; `.env.example` (no real values) kept in the folder | [Default] | Security basics. |
| D-24 | *(revised for Prisma)* DB access only through the Prisma client. If raw SQL is ever needed, use tagged `prisma.$queryRaw\`…\``; **never `$queryRawUnsafe`** or string concatenation | [Default] | Prisma parameterizes queries, which prevents SQL injection. |
| D-25 | Date display without `intl`: small helper formats `"Fri 28 Nov"` | [Default] | Avoids a package for one function. |
| D-26 | **Git + private GitHub repo** (changed 2026-11-26; was "no git"). One repo for the whole folder; root `.gitignore` keeps `.env*` (except `.env.example`), `.vercel/`, `node_modules/`, build output and Android local/key files out. Solo project → all docs committed. Deploys stay **manual via Vercel CLI** (O-05); Vercel Git auto-deploy not connected (could be added later for the API, root dir `api`; web can't build on Vercel: no Flutter there) | [Decided] | Owner: git is fine now that the app is finished; private repo, no auto-deploy (2026-11-26). |
| D-27 | Seed has **one course: CSC452 Mobile Programming**. `courses` table and course dropdown are kept (dropdown pre-selects CSC452) | [Default] | Owner gave only CSC452. Keeping the table costs little and lets more courses be added with one seed line. |
| D-28 | **No schedule/deadlines in PLAN**; build steps in order as fast as possible | [Decided] | Owner will finish ASAP. |
| D-29 | **Optional Flutter web build on Vercel** (PLAN Step 9, after the mobile app is demo-ready): `flutter build web` locally, upload `app/build/web/` as a second Vercel project via the same method as O-05. Primary demo stays on emulator/phone | [Decided] | Lets classmates/teacher try it from a link with no install. Web differences: needs CORS (already allowed, §7); refresh logs you out (D-10); no URL routing needed. |
| D-30 | **Prisma ORM instead of mysql2** (database: D-39). Schema in `api/prisma/schema.prisma`, tables created with `prisma db push`, client generated in `postinstall` for Vercel. All Prisma calls live in `api/src/repos/`; routes never call Prisma directly | [Decided] | Owner already knows Prisma from Next.js projects and is more confident with it. Exact setup: D-34. |
| D-33 | API written in **plain JavaScript, CommonJS** (`require` / `module.exports`) | [Decided] | Owner's choice; closer to the course labs. |
| D-34 | **Prisma 7.10.1, pinned** (`prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7` + `pg`; `prisma` in `dependencies`, not devDependencies). Generator **`prisma-client-js`** (output in `node_modules/@prisma/client`, works with `require`). Config in **`api/prisma.config.js`** (datasource URL + seed command; loads `.env` via dotenv). Client created with **`@prisma/adapter-pg`** (D-39) | [Decided] | `npm i prisma` (tag `latest`) currently installs **8.0.0-rc.35**, a release candidate, hence the pin. Prisma 7 docs are TypeScript-first; the newer `prisma-client` generator emits TS, so `prisma-client-js` is used. **Verified 2026-11-26:** generate + `require` + `PrismaPg` client construction OK; real Neon connection verified in PLAN Step 1. *(Revised 2026-11-26: was `@prisma/adapter-mariadb` for TiDB.)* |
| D-35 | **Runtime & tool versions** as in §12. Node.js **24 LTS** (installed 22.12.0 is exactly Prisma 7's minimum); Flutter **3.50.x** (installed 3.47.2) | [Default] | Upgrading now avoids hitting edge-of-support bugs later. Owner runs the installers. |
| D-36 | Flutter imports **`package:material_ui/material_ui.dart`** instead of `package:flutter/material.dart` | [Default] | `flutter/material.dart` is formally deprecated in Flutter 3.50; new `flutter create` projects already use `material_ui` (official Flutter team package). Course lab code still works, but triggers deprecation warnings in `flutter analyze`. Widget names are expected to be the same (verify in Step 5 with `flutter analyze`). |
| D-38 | **Env vars**: `DATABASE_URL` (Neon **pooled**, used by the app via `db.js`), `DATABASE_URL_UNPOOLED` (Neon **direct**, used by the Prisma CLI in `prisma.config.js`), `JWT_SECRET`. `api/.vercelignore` keeps `.env` and `node_modules` out of CLI uploads. `package.json` `overrides` pins `effect` ≥ 3.22.5 | [Default] | Neon's rule: app traffic through the pooler; schema changes over a direct connection (the pooler breaks Prisma's schema commands with errors like `prepared statement "s0" already exists`). Names match what Neon's Vercel integration sets. `.vercelignore` matters because there is no git/`.gitignore`. `effect` (inside the Prisma CLI) had a high-severity ReDoS advisory; `npm audit fix --force` would have downgraded Prisma to 6.12, so an override is the safe fix (audit 0). |
| D-39 | **Database: Neon (serverless PostgreSQL)** replaces TiDB Cloud + DBeaver. Schema `provider = "postgresql"`; data browsed with **Neon's web console** and **`npx prisma studio`**; free plan, region Singapore | [Decided] | Owner wanted a simpler, modern setup. PostgreSQL is Prisma's officially supported, best-documented path (TiDB is not on Prisma 7's supported list), and Neon has a built-in Vercel integration. Presentation line: *why* we switched. Free plan: compute sleeps after 5 min idle (first request ~hundreds of ms slower). |
| D-37 | **Vercel zero-config Express**: entry `api/src/index.js` does `module.exports = app` (no `app.listen`, **no `vercel.json`**). Local dev uses `api/src/dev.js` (not a name Vercel looks for) with `node --watch` | [Default] | Current Vercel docs detect `src/index.js` automatically; the older `/api` folder + `vercel.json` rewrite advice is outdated. `node --watch` is stable, so nodemon isn't needed. |
| D-40 | **Auth hardening + extras (Step 2)**: `GET /me` endpoint; JWT verify pinned to **HS256** (blocks `alg: none`) and rejects non-integer `id`; login compares against a dummy bcrypt hash when the email is unknown (same timing as a wrong password); password limit is **72 bytes** (Thai chars = 3 bytes); JSON body limit 100 kB; broken JSON → 400, unknown route → JSON 404 | [Default] | Cheap protections that match SPEC §7. `/me` lets the app check a token and lets tests exercise the middleware. |
| D-41 | **Two test suites**: `npm test` = unit tests (no DB, fast); `npm run test:api` = real HTTP requests to the app against Neon, creates `apitest-*@duesoon.test` users and deletes them afterwards | [Default] | Unit tests stay fast and offline; API tests prove the real stack (Express + Prisma + Neon) works. |
| D-42 | **Live API setup**: Vercel project `duesoon-api`, URL `https://duesoon-api.vercel.app`. Production + Preview env vars: `DATABASE_URL` (pooled, verify-full, **same Neon DB as local**) and a **separate random `JWT_SECRET`** (not the local one). `.vercelignore` also drops `.env*.local` (`vercel link` writes a `VERCEL_OIDC_TOKEN` there) | [Decided] | Owner chose 2026-11-26. One DB keeps the demo data shared; separate secret limits damage if one leaks. Trade-off: `npm run test:api` and `prisma db seed` change live data. |
| D-43 | **Flutter project**: `flutter create --org com.duesoon --project-name duesoon --platforms android,web` (app id `com.duesoon.duesoon`). API base URL in `lib/config.dart` from `--dart-define=API_BASE`, default the live URL (D-42) | [Decided] | Owner chose 2026-11-26. Web kept for optional D-29; iOS can't build on Windows. Live URL by default means the emulator works with no local server. |
| D-44 | **Android NDK pinned to the installed 30.0.16138531** in `app/android/app/build.gradle.kts` (instead of `flutter.ndkVersion` = 28.2) | [Default] | Gradle's auto-install of 28.2 (~2 GB) failed with ~5 GB free on C:. The app has no native code; a newer NDK is fine. Revert to `flutter.ndkVersion` if a plugin ever needs it and there's disk space. |
| D-45 | **App-side errors**: `ApiService` throws `ApiException(status, message)`; status **0** = no connection / 10 s timeout. Screens map 401/409/400 to their own text; anything else → "Something went wrong". Validators in `utils/validators.dart` copy `validate.js` exactly (login only checks non-empty, like the server). `MockClient` from `package:http/testing.dart` (inside `http`) for tests | [Default] | One error type keeps screens simple; same rules both sides means the server never rejects what the form accepted. |
| D-46 | **Done checkbox waits for the server**: tap → small spinner on that card (double taps ignored) → POST/DELETE `/tasks/:id/done` → reload the tab. Each tab reloads whenever it is shown. Any 401 after login → `showApiError` clears Session, back to Login with "Session expired". Task cards are a custom Row, **not `ListTile`** (its fixed height clipped the subtitle when a title wrapped; regression test `task_card_test.dart`) | [Decided] | Owner chose waiting over optimistic updates 2026-11-26: always matches the server, no undo logic. |
| D-47 | **Task form + detail**: date picker's "today" = **Bangkok date** from the phone clock (`utils/dates.dart todayBangkok()`, same rule as the API); create: today…today+365, edit: from min(today, current due)…today+365 (D-19). Form validators mirror `validateTask`; server 400 message shown as SnackBar. Detail: owner-only Edit/Delete (delete asks first), 404 → "This task was deleted" + back; pops `true` on any change → list reloads; adding reloads all tabs. Type buttons are text-only (with icons, "Assignment" wrapped on a phone) | [Decided] | Owner chose Bangkok date 2026-11-26: a phone in another time zone still matches the server. |
| D-48 | **App icon + demo setup**: launcher icon hand-made (no package): Android adaptive vector (`res/drawable/ic_launcher_foreground.xml`, Material `event_available` glyph, indigo `#3F51B5` background, monochrome layer for themed icons) + PNG fallbacks and web icons rendered once from the same SVG with headless Chrome. Web title/manifest = "DueSoon". Demo on the **emulator**, release APK on a phone as backup; script in `docs/DEMO.md`. API replies with an unexpected shape → `ApiException` (generic message), not a crash. No slides | [Decided] | Owner choices 2026-11-26 (O-03 keep in-memory login, O-04 emulator + APK, icon hand-made, no slides). |
| D-49 | **Web build live**: Vercel project `duesoon-web` → https://duesoon-web-phi.vercel.app (`duesoon-web` name was taken). Deployed from `app/build/web/` (linked there; `.vercelignore` there excludes `.env*` (Vercel writes an OIDC token to `.env.local` on link), `.gitignore`, `*.map`). `flutter clean` deletes both → re-run `vercel link --yes --project duesoon-web` and recreate `.vercelignore` before deploying. Same live API; CORS already allowed (§7). Type chip (`TypeChip`) exposes plain text to screen readers: Flutter's `Chip` reported itself as a checkbox (found in the web check) | [Decided] | Step 9, 2026-11-26. Refresh on web logs you out (D-10), accepted. |
| D-50 | **Back during a running request waits for it**: on the detail screen, back (button, gesture or AppBar) while Mark as done / Delete is still waiting for the server keeps the spinner until the reply, then pops with the result, so the list reloads *after* the change is saved. A second back press is ignored (no double pop) | [Decided] | Bug 2026-11-28: pressing back while the request ran popped with `false` → list not reloaded, task stayed in This Week. Regression tests: `app/test/detail_back_test.dart`. |
| D-31 | **UI style: lists grouped by day**. Section headers *Overdue / Today / Tomorrow / This week / Later*, each holding **cards** with a left urgency strip and a type chip (see §6.1) | [Decided] | Best fit for a deadline app: the "when" is visible at a glance. Built-in widgets only. |
| D-32 | **Theme: Material 3, seed color indigo**, **light + dark mode following the phone** (`ThemeMode.system`). Urgency colors fixed and checked for readability in both modes | [Decided] | Indigo doesn't compete with red/orange/green; dark mode is ~3 lines with `ColorScheme.fromSeed`. |

---

## 3. Data model (Prisma → Neon Postgres)

```prisma
// api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"       // D-34: works with CommonJS require
}

datasource db {
  provider = "postgresql"             // Neon (D-39). Prisma 7: no url here; it lives in prisma.config.js
}

enum TaskType {
  assignment
  exam
  quiz
}

model User {
  id           Int        @id @default(autoincrement())
  name         String     @db.VarChar(50)
  email        String     @unique @db.VarChar(100)   // stored lowercased + trimmed
  passwordHash String     @map("password_hash") @db.VarChar(100)
  createdAt    DateTime   @default(now()) @map("created_at")
  tasks        Task[]
  done         TaskDone[]
  @@map("users")
}

model Course {
  id    Int    @id @default(autoincrement())
  code  String @unique @db.VarChar(20)     // CSC452
  name  String @db.VarChar(100)            // Mobile Programming
  tasks Task[]
  @@map("courses")
}

model Task {
  id          Int        @id @default(autoincrement())
  courseId    Int        @map("course_id")
  title       String     @db.VarChar(100)
  type        TaskType
  dueDate     DateTime   @map("due_date") @db.Date
  description String?    @db.Text
  createdBy   Int        @map("created_by")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  course      Course     @relation(fields: [courseId], references: [id])
  creator     User       @relation(fields: [createdBy], references: [id])
  done        TaskDone[]
  @@index([dueDate])
  @@map("tasks")
}

model TaskDone {
  userId Int      @map("user_id")
  taskId Int      @map("task_id")
  doneAt DateTime @default(now()) @map("done_at")
  user   User     @relation(fields: [userId], references: [id])
  task   Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  @@id([userId, taskId])
  @@map("task_done")
}
```
```js
// api/prisma.config.js
require("dotenv").config({ quiet: true });
const { defineConfig } = require("prisma/config");
module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node prisma/seed.js" },
  datasource: { url: process.env.DATABASE_URL_UNPOOLED },  // CLI uses Neon's DIRECT URL; process.env so `prisma generate` on Vercel doesn't fail if unset
});

// api/src/db.js
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });  // Neon POOLED URL
module.exports = new PrismaClient({ adapter, log: process.env.PRISMA_LOG ? ["query"] : [] });
```
Env vars: see D-38. TLS: app URL uses `?sslmode=verify-full` (strict certificate check; `pg` 8 warns that `require` will become weaker in `pg` 9); CLI URL keeps Neon's `?sslmode=require`.

Database tables/columns stay **snake_case** (readable in Neon's console / Prisma Studio); Prisma code uses **camelCase**; the API's JSON uses **snake_case** (§4). Conversion happens in one `toTaskJson()` function per repo.

### 3.1 Key queries (in `api/src/repos/tasks.js`)

**Task list with my done flag.** *Verified with `PRISMA_LOG=1`:* Prisma runs this as **two queries**: tasks first, then `SELECT … FROM task_done WHERE user_id = $1 AND task_id IN (…)`, and merges them in memory. The result is the same as a LEFT JOIN filtered by me:
```js
prisma.task.findMany({
  where: filterWhere,                        // §4.3
  include: {
    course: true,
    done: { where: { userId: me } },         // [] = not done, [row] = done by me
  },
  orderBy: [{ dueDate: "asc" }, { id: "asc" }],
})
// → done = task.done.length > 0
// → days_left = daysBetween(today, toDateStr(task.dueDate))   (lib/dates.js)
```

**Task detail + done count** (the `COUNT()`):
```js
prisma.task.findUnique({
  where: { id },
  include: {
    course: true,
    creator: { select: { name: true } },
    done: { where: { userId: me } },
    _count: { select: { done: true } },      // → done_count
  },
})
```

**Presentation tip:** run locally with `PRISMA_LOG=1` (turns on `log: ["query"]`, see `db.js`) and screenshot the generated SQL for a slide. Verified output: the `_count` query is a real **`LEFT JOIN (SELECT task_id, COUNT(*) … GROUP BY task_id)`**, and the done-flag include is the two-query pattern above. Both make good talking points ("what the ORM does for you").

### 3.2 Seed data (`api/prisma/seed.js`)
- 1 course: CSC452 Mobile Programming (D-27).
- 4 demo users (password `demo1234`, hashed with bcryptjs inside the script).
- ~10 CSC452 tasks spread across types (labs, quizzes, midterm/final, project), due from −2 to +20 days relative to `todayBangkok()` (D-21): at least one overdue, one due today, one tomorrow, one in 2 days, several later. That fills every group header in D-31.
- A few `TaskDone` rows so counts read 0, 1 and 3.
- Script is **re-runnable**: deletes existing rows (done → tasks → users → courses) first.

---

## 4. API (Express on Vercel)

### 4.1 Conventions
- Base URL: **`https://duesoon-api.vercel.app`** (production alias, D-42; kept in `app/lib/config.dart`).
- JSON in/out, **snake_case** keys. Dates are `"YYYY-MM-DD"` strings.
- Errors: `{ "error": "human-readable message" }` with status:
  `400` validation · `401` missing/invalid/expired token or bad login · `403` not the owner · `404` not found · `409` email already registered · `500` unexpected (message generic; details only in server log).
- Every route except `GET /`, `POST /register`, `POST /login` requires `Authorization: Bearer <token>`.
- JWT: payload `{ id, name }`, signed with `JWT_SECRET`, expires in **7 days**.

### 4.2 Endpoints

| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/` | – | `200 {status:"ok"}` health check | – |
| POST | `/register` | `{name, email, password}` | `201 {token, user:{id,name,email}}` | 400, 409 (Prisma error `P2002` on email) |
| POST | `/login` | `{email, password}` | `200 {token, user}` | 400, 401 (`"Invalid email or password"`, same message for unknown email and wrong password) |
| GET | `/me` | – | `200 {user:{id,name}}` (who the token belongs to, D-40) | 401 |
| GET | `/courses` | – | `200 [{id, code, name}]` ordered by code | 401 |
| GET | `/tasks?filter=week\|all\|done` | – | `200 [TaskListItem]` (default `all`) | 400 bad filter, 401 |
| GET | `/tasks/:id` | – | `200 TaskDetail` | 401, 404 |
| POST | `/tasks` | `TaskInput` | `201 TaskDetail` | 400, 401 |
| PUT | `/tasks/:id` | `TaskInput` (all fields) | `200 TaskDetail` | 400, 401, 403, 404 |
| DELETE | `/tasks/:id` | – | `204` | 401, 403, 404 |
| POST | `/tasks/:id/done` | – | `200 {done:true, done_count}` | 401, 404 |
| DELETE | `/tasks/:id/done` | – | `200 {done:false, done_count}` | 401, 404 |

**Shapes**
```jsonc
// TaskListItem
{ "id": 7, "title": "Lab 6: Full CRUD", "type": "assignment", "due_date": "2026-11-28",
  "course_id": 1, "course_code": "CSC452", "course_name": "Mobile Programming",
  "done": false, "days_left": 2 }

// TaskDetail = TaskListItem + 
{ "description": "Submit GitHub link on LMS", "created_by": 3, "creator_name": "Mai",
  "is_owner": true, "done_count": 12 }

// TaskInput
{ "title": "...", "course_id": 1, "type": "quiz", "due_date": "2026-12-03", "description": "..." }
```

### 4.3 Filters (Prisma `where` for §3.1)
| filter | where | order |
|---|---|---|
| `week` | `{ dueDate: { lte: fromDateStr(addDays(today, 7)) }, done: { none: { userId: me } } }` (includes all overdue) | dueDate asc |
| `all` | `{}` (every task, done or not) | dueDate asc |
| `done` | `{ done: { some: { userId: me } } }` | my `doneAt` desc (sorted in JS) |

Boundary: a task due exactly today + 7 **is** in This Week; today + 8 is not.

### 4.4 Validation (`lib/validate.js`; server is the rule; app mirrors it)
| Field | Rule |
|---|---|
| name | trimmed, 1–50 chars |
| email | trimmed + lowercased, contains `@` and a `.` after it, ≤ 100 chars |
| password | 6–72 chars (72 = bcrypt's limit) |
| title | trimmed, 1–100 chars |
| course_id | integer that exists in `courses` |
| type | one of `assignment`, `exam`, `quiz` |
| due_date | real calendar date `YYYY-MM-DD` (reject `2026-02-30`); create: ≥ today; edit: any; both: ≤ today + 365 (D-19) |
| description | optional, ≤ 1000 chars, trimmed; empty → `null` |
| `:id` params | positive integer, else 404 |

### 4.5 Ownership check order (PUT/DELETE)
1. Load task by id → none? **404**. 2. `task.createdBy !== req.user.id` → **403**. 3. Update/delete.

---

## 5. Shared rules (implemented once per side, same thresholds)
| Rule | API (`api/src/lib/dates.js`) | App (`app/lib/utils/`) |
|---|---|---|
| Today | `todayBangkok(now = new Date())` → `"YYYY-MM-DD"` | – (uses `days_left` from API) |
| Conversion | `toDateStr(Date)`, `fromDateStr(str)`, `addDays(str, n)`, `daysBetween(a, b)` | `date_format.dart`: `"YYYY-MM-DD"` → `"Fri 28 Nov"` |
| Urgency | – | `urgencyOf(daysLeft, done)` → `done / overdue / soon / later` |
| Group (D-31) | – | `groupOf(daysLeft)` → `<0` Overdue · `0` Today · `1` Tomorrow · `2–7` This week · `>7` Later |
| Label | – | `-3` → "3 days overdue", `0` → "Due today", `1` → "Tomorrow", `n` → "In n days" |

The app **never computes days_left itself**. It trusts the API, so the phone's clock and time zone can't disagree with the server.

---

## 6. Screens (Flutter)

| # | Screen | Contents & behaviour |
|---|---|---|
| S1 | **Splash** | App icon + "DueSoon" on indigo background, ~2 s, then `pushReplacement` → Login (D-10). |
| S2 | **Login** | Email, password (`TextFormField` + validators per §4.4). `FilledButton` shows a spinner while loading. Success → save token in `Session` → `pushReplacement` Home. 401 → SnackBar "Invalid email or password". Link to Register. |
| S3 | **Register** | Name, email, password, confirm password (must match). Success → logged in → Home. 409 → SnackBar "Email already registered". |
| S4 | **Home (Tabs)** | `DefaultTabController` with **This Week / All / Done**. AppBar: title, logout icon (clear Session → Login). FAB **+** → S6. Each tab: list grouped by day (§6.1), `RefreshIndicator` pull-to-refresh, empty states (§6.1). **Done** tab is not grouped: flat list, most recently finished first. |
| S5 | **Task detail** | Loads `GET /tasks/:id`. Large title, type chip, info rows with icons (📅 due date + urgency label, 📘 course, 👤 "Added by Mai"), description, done count line (D-20), full-width **Mark as done / Mark as not done** button. If `is_owner`: Edit (→ S6 pre-filled) and Delete (confirm dialog → DELETE → pop with `true`). |
| S6 | **Add / Edit task** | Title, course (`DropdownButtonFormField` from `GET /courses`, CSC452 pre-selected), type (`SegmentedButton`: Assignment / Quiz / Exam), due date (`showDatePicker`, first date = today on create), description (multiline). Validators per §4.4. Save → POST/PUT → pop with `true`. |
| S7 | Course list | **Not built** (dropped: only one course, D-27). |

**Refresh rule:** any screen that changes data pops with `true`; the caller reloads when it gets `true`.
**Errors:** network/500 → SnackBar "Something went wrong. Pull to retry." · any 401 → clear Session, go to Login with SnackBar "Session expired, please log in again".

### 6.1 UI style (D-31, D-32)
**Theme** (`main.dart`):
```dart
import 'package:material_ui/material_ui.dart';   // D-36 (not flutter/material.dart)

theme:     ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo)),
darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo, brightness: Brightness.dark)),
themeMode: ThemeMode.system,
// Material 3 is the default since Flutter 3.16, so no useMaterial3 flag is needed.
```
All other colors come from `Theme.of(context).colorScheme`. **Never hard-code** colors except the urgency set below.

**Urgency colors** (`utils/urgency.dart`, one place):
| Urgency | Light mode | Dark mode |
|---|---|---|
| overdue | `Colors.red.shade700` | `Colors.red.shade300` |
| soon | `Colors.orange.shade800` | `Colors.orange.shade300` |
| later | `Colors.green.shade700` | `Colors.green.shade300` |
| done | `colorScheme.outline` (grey) | same |

**Grouped list (S4 This Week / All):**
```
OVERDUE                        ← small caps header, colored like its urgency
┃ Lab 5: Forms        [Lab] ☐  ← Card; 4px left strip in urgency color
┃ CSC452 · 2 days overdue         subtitle: course · urgency label (urgency color)
TODAY
┃ Quiz 3: HTTP       [Quiz] ☐
┃ CSC452 · Due today
TOMORROW · THIS WEEK · LATER   ← headers only shown if the group has tasks
```
- Built from one `ListView.builder` over a flat list of "header" and "task" items (keeps it simple, no extra packages).
- Card: `Card` + `ListTile`; type as a small `Chip`; trailing `Checkbox` toggles done.
- Done cards (in All/Done tabs): grey strip, title with strikethrough, checkbox ticked.

**Empty states** (icon 64px + one line, centered):
| Tab | Icon | Text |
|---|---|---|
| This Week | `Icons.celebration` | "Nothing due this week 🎉" |
| All | `Icons.playlist_add` | "No tasks yet. Tap + to add one" |
| Done | `Icons.task_alt` | "Nothing finished yet" |

**Spacing:** padding is always 8, 16 or 24. Cards have horizontal margin 16 and vertical margin 4.
**Check:** take screenshots of S4 and S5 in **both** light and dark mode and confirm every urgency label is readable.

---

## 7. Security
- JWT secret ≥ 32 random chars, only in env vars (D-23). No git, so never paste `.env` contents into code, docs, screenshots or the submitted zip (submit `.env.example` instead).
- Passwords bcrypt-hashed (D-07); login error never reveals whether the email exists.
- Server derives user id only from the token (D-06); ownership enforced in the route handler (D-15).
- DB only via Prisma; no `$queryRawUnsafe` (D-24). Never log tokens or passwords. Prisma query logging is **dev only**.
- CORS: allow all origins (mobile + web client, no cookies).

---

## 8. Project folder layout
```
duesoon/
├─ CLAUDE.md                 # how to work on this project
├─ README.md                 # what it is, screenshots, how to run, API, tests
├─ docs/  SPEC.md · PLAN.md · PROGRESS.md · DEMO.md (demo script) · screenshots/ (S1–S6 light + dark)
├─ api/                      # Express 5 + Prisma 7 (CommonJS JS) → Vercel zero-config
│  ├─ package.json           # "type":"commonjs"; engines.node "24.x"; scripts: dev (node --watch src/dev.js),
│  │                         #   test (node --test), postinstall (prisma generate)
│  ├─ prisma.config.js       # Prisma 7 config (D-34)
│  ├─ .env.example           # no vercel.json (D-37)
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ seed.js
│  ├─ src/
│  │  ├─ index.js            # builds the Express app, module.exports = app (Vercel entry)
│  │  ├─ dev.js              # local only: require('./index').listen(3000)
│  │  ├─ db.js               # one shared PrismaClient
│  │  ├─ middleware/auth.js  # verifies Bearer token → req.user
│  │  ├─ routes/  auth.js · courses.js · tasks.js
│  │  ├─ repos/   users.js · courses.js · tasks.js   # all Prisma calls + toXJson()
│  │  └─ lib/     dates.js · validate.js
│  └─ test/  dates.test.js · validate.test.js
└─ app/                      # Flutter
   └─ lib/
      ├─ main.dart (theme)  config.dart
      ├─ models/    task.dart · course.dart · user.dart
      ├─ services/  api_service.dart (all HTTP + token header) · session.dart
      ├─ screens/   splash · login · register · home · task_detail · task_form   (+ utils/dates.dart)
      ├─ widgets/   task_card.dart · group_header.dart · grouped_task_list.dart · empty_state.dart · task_list_tab.dart
      └─ utils/     urgency.dart · date_format.dart · validators.dart · api_errors.dart
```

---

## 9. Acceptance checklist (demo-ready = all ticked)
**API** (all ticked 2026-11-26 by `npm run test:api`: 25 tests against Neon)
- [x] Register → 201 + token; same email again (any case) → 409
- [x] Login wrong password and unknown email → both 401, same message
- [x] `/tasks` without token → 401; with garbage token → 401
- [x] `week` includes overdue + today+7, excludes today+8 and done tasks
- [x] User A marks done → A's `done=true`, B's `done=false`; marking twice → still one row, count unchanged
- [x] B edits/deletes A's task → 403; missing id → 404
- [x] Delete task → its done rows gone
- [x] Create with past due date → 400; edit with past date → 200; `2026-02-30` → 400
- [x] Every `due_date` in responses is `"YYYY-MM-DD"` and matches Neon's console / Prisma Studio (no off-by-one)
- [x] At 01:00 Bangkok (simulated via `todayBangkok(now)` test), today = Bangkok date, not UTC date

**App** (ticked 2026-11-26 from emulator runs vs the live API in Steps 5–7; re-run in Step 8)
- [x] Every screen S1–S6 reachable; validators show messages; SnackBars on errors
- [x] Seeded data fills Overdue / Today / Tomorrow / This week / Later groups with the right colors (D-14, D-31)
- [x] Light **and** dark mode screenshots of S4 + S5 readable (D-32)
- [x] Non-owner sees no Edit/Delete
- [x] Lists refresh after add/edit/delete/done
- [x] Runs against the **deployed** Vercel API
- [x] (Optional, D-29) Web build on Vercel: login, tabs, done toggle and add/edit work in Chrome; no CORS errors in the browser console (2026-11-26, https://duesoon-web-phi.vercel.app, D-49)

**Tests:** `npm test` passes in `api/`; `flutter test` and `flutter analyze` pass in `app/`.

---

## 10. Open items
| ID | Question | Needed by |
|---|---|---|
| ~~O-01~~ | Course list for seed → **resolved**: CSC452 only (D-27) | – |
| ~~O-02~~ | Project due date → **resolved**: no schedule, ASAP (D-28) | – |
| ~~O-03~~ | Persistent login → **resolved: keep in memory** (D-10, owner 2026-11-26) | – |
| ~~O-04~~ | Demo device → **resolved: emulator + release APK backup** (D-48) | – |
| ~~O-08~~ | 2-day task: orange "soon" strip under green THIS WEEK header → **resolved: keep as is** (owner, 2026-11-26). Strip = urgency (D-14), header = day group (D-31); they answer different questions | – |
| ~~O-05~~ | Deploy without git → **resolved (owner OK'd)**: Vercel CLI, `npx vercel --prod` in `api/`; `npx vercel --cwd build/web --prod` in `app/` for D-29; env vars via `npx vercel env add` or dashboard | – |
| ~~O-06~~ | Prisma version → **resolved**: 7.10.1 pinned, JS setup (D-33, D-34) | – |
| ~~O-07~~ | **Resolved**: Vercel offers 22.x / 24.x / 26.x (default 26.x); `engines.node "24.x"` overrides the project setting (use `24.x`, not `>=24`, which maps to 26.x). Source: vercel.com/docs/functions/runtimes/node-js/node-js-versions | – |

---

## 11. Change log
- **2026-11-28**: Added D-50 (detail back waits for a running done/delete request; bug fix + 4 tests).
- **2026-11-26**: D-26 changed: git + private GitHub repo; deploys stay manual (CLI).
- **2026-11-26**: Step 9 done: web build live (D-49), §9 web item ticked; `TypeChip` accessibility fix.
- **2026-11-26**: Step 8 done (polish + demo prep). Added D-48; D-10 → [Decided]; O-03, O-04 resolved. README + DEMO.md + screenshots.
- **2026-11-26**: Step 7 done (detail, add/edit/delete). Added D-47; §9 App checklist ticked (web item still optional/open).
- **2026-11-26**: O-08 resolved: keep 2-day color/group as is.
- **2026-11-26**: Step 6 done (Home tabs). Added D-46 (checkbox waits for server, 401 handling, card layout), O-08 (2-day color vs group); §8 layout.
- **2026-11-26**: Step 5 done (Flutter app created, auth screens). Added D-44 (NDK pin), D-45 (app errors/validators); §8 + §12 updated.
- **2026-11-26**: Flutter 3.50.1 / Dart 3.14.0 installed; §12 updated (D-35 unchanged).
- **2026-11-26**: API live at `https://duesoon-api.vercel.app`. Added D-42 (live setup), resolved O-07, §4.1 base URL.
- **2026-11-26**: Vercel CLI upgraded 34.1.11 → 67.0.0 (global); commands now plain `vercel` (§12 note).
- **2026-11-26**: Node 24.22.3 installed; §12 updated (D-35 unchanged).
- **2026-11-26**: Step 3 done: all endpoints in §4.2 implemented; §9 API checklist fully verified by automated API tests. Non-owner gets 403 *before* validation (no hints).
- **2026-11-26**: Step 2 done. Added `GET /me` to §4.2; D-40 (auth hardening), D-41 (unit vs API test suites).
- **2026-11-26**: Step 1 verified on Neon. Finding: Prisma's `include` uses two queries (`IN (…)`), not a JOIN; `_count` uses LEFT JOIN + COUNT + GROUP BY. Updated §1, §3.1 wording. App URL now `sslmode=verify-full` (D-38 note in §3).
- **2026-11-26**: **Switched database from TiDB Cloud + DBeaver to Neon Postgres** (D-39) at owner's request (simpler setup, Prisma's official path). Adapter `@prisma/adapter-mariadb` → `@prisma/adapter-pg` + `pg`; schema provider `postgresql`; D-38 now pooled `DATABASE_URL` + direct `DATABASE_URL_UNPOOLED`. Revised D-30, D-34, D-38; updated §3, §9, §12.
- **2026-11-26**: O-05 resolved (Vercel CLI OK). Added D-38 (single `DATABASE_URL`, `.vercelignore`, `effect` override). §3 `db.js` snippet updated to match the code.
- **2026-11-26**: Checked official docs + npm registry for every tool. Added D-33 (plain JS, CommonJS), D-34 (Prisma 7.10.1 pinned, `prisma-client-js`, `prisma.config.js`, MariaDB adapter; spike verified), D-35 (Node 24 LTS, Flutter 3.50), D-36 (`material_ui` import), D-37 (Vercel zero-config Express, `src/index.js`, no vercel.json). Updated §3 config/client code, §6.1 theme code, §8 layout; new §12 versions. Resolved O-06; O-05 now a [Default]; added O-07.
- **2026-11-26**: Switched DB access to **Prisma** (D-30); revised D-07, D-08, D-12, D-13, D-16, D-21, D-24 accordingly; rewrote §3 (Prisma schema + queries), §4.3 filters, §8 layout. Added **UI style**: grouped-by-day cards (D-31), Material 3 indigo + light/dark (D-32), new §6.1. Added O-06 (Prisma version). Dropped S7 course list.
- **2026-11-26**: Added D-29 (optional Flutter web build hosted on Vercel) and its acceptance check; O-05 now covers both deploys.
- **2026-11-26**: Added D-26 (no git), D-27 (CSC452 only), D-28 (no schedule). Resolved O-01, O-02; added O-05 (Vercel deploy without git). D-04/D-05 reworded from "repo" to "project folder".
- **2026-11-26**: Initial spec from the pitch + owner's answers (D-01…D-25). Decided: JWT auth, This Week = overdue + 7 days, one project folder with organized subfolders, course stack + minimal new packages.

---

## 12. Versions (checked 2026-11-26)
Source: npm registry (`npm view <pkg> dist-tags`) + official docs below. Re-check before upgrading anything.

| Tool | Use | Version | Notes |
|---|---|---|---|
| Node.js | API runtime | **24.x LTS** (installed: 24.22.3) | Latest LTS is 26.x; 24 chosen as the safer Vercel match (O-07). Prisma 7 needs `^20.19 \|\| ^22.12 \|\| >=24`. `node --test` and `node --watch` are stable. |
| Express | API framework | **5.3.0** | v5: rejected promises in async handlers go to the error handler automatically (no try/catch wrapper needed). |
| prisma / @prisma/client / @prisma/adapter-pg | ORM | **7.10.1** (pin `@7`) | npm `latest` = 8.0.0-rc.35 (release candidate). Do **not** run `npm i prisma` without `@7`. |
| jsonwebtoken | JWT | **9.0.3** | |
| bcryptjs | password hashing | **3.0.3** | v3 ships ESM + UMD; `require` works. New hashes use the `2b` prefix. |
| dotenv | `.env` loading | **18.0.10** | Used by `prisma.config.js` and `dev.js`; Vercel injects env vars itself. |
| cors | CORS | **2.8.6** | |
| pg | Postgres driver (used by adapter-pg) | **8.23.1** | |
| Neon | database | free plan, managed | Console: console.neon.tech |
| vercel (CLI) | deploy | **67.0.0** (global install, run as `vercel`) | `npx vercel` silently used an old global v34.1.11; upgraded with `npm i -g vercel@latest`. Check `vercel --version` before deploying. |
| Flutter / Dart | app | **3.50.x / 3.14** (installed: 3.50.1 / 3.14.0, `flutter doctor` clean) | 3.50 deprecates `flutter/material.dart`, so use `material_ui` (D-36). |
| material_ui | Material widgets | **1.1.0** (in the 3.50 `flutter create` template) | Official replacement since 3.47. |
| http | API calls | **1.6.0** | `package:http/testing.dart` (`MockClient`) used in tests. |

**Official docs used:**
- Prisma 7 MySQL quickstart (used before D-39): https://www.prisma.io/docs/v7/prisma-orm/quickstart/mysql
- Neon connection pooling (pooled vs direct): https://neon.com/docs/connect/connection-pooling
- Neon + Prisma guide: https://neon.com/docs/guides/prisma
- Prisma config reference: https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference
- Prisma on Vercel: https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel
- Prisma changelog (v8 RC, npm `latest` tag): https://www.prisma.io/changelog
- Express on Vercel: https://vercel.com/docs/frameworks/backend/express
- Vercel CLI deploy: https://vercel.com/docs/cli/deploy
- Flutter 3.50: https://flutter.dev/blog/whats-new-in-flutter-3-50
- material_ui migration: https://docs.flutter.dev/release/breaking-changes/material-ui-and-cupertino-ui
- Node releases: https://nodejs.org/en/about/previous-releases

# DueSoon team split

Each member owns **one feature from the screen to the database**: their Flutter screens and the
API routes + database code behind them. In your part, focus on what we were taught in class
(Flutter widgets, navigation, forms, http + JSON, Express routes, REST, database queries).
**Demo:** Billy presents the whole app alone (`DEMO.md`), then ends with this split so the professor can ask each of us about our part. Be ready to answer questions on yours.

**New here? Start with** https://amm2049.github.io/duesoon/start.html

**Learn your part:** https://amm2049.github.io/duesoon/code-guide.html, then press your member button.
Direct links: [Member 1](https://amm2049.github.io/duesoon/code-guide.html?member=1) ·
[Member 2](https://amm2049.github.io/duesoon/code-guide.html?member=2) ·
[Member 3](https://amm2049.github.io/duesoon/code-guide.html?member=3). It has every file's code, step-by-step flows
with line links, and practice questions.

## Member 1 (Grace): Getting in (accounts)
- **Flutter (`app/lib/`):** `screens/splash_screen.dart`, `screens/login_screen.dart`, `screens/register_screen.dart`, `utils/validators.dart`, `services/session.dart`, `utils/api_errors.dart`
- **Backend (`api/src/`):** `routes/auth.js` (POST /register, POST /login, GET /me), `middleware/auth.js` (token check), `lib/token.js` (JWT), `repos/users.js`, register/login rules in `lib/validate.js`
- **Be ready to explain:** login with a wrong password, register, log out; how the token works and why passwords are hashed

## Member 2 (Billy): Seeing tasks (home + lists)
- **Flutter (`app/lib/`):** `screens/home_screen.dart`, `widgets/` (all), `models/`, `services/api_service.dart` (loading the lists), `utils/urgency.dart`, `config.dart`
- **Backend:** `GET /tasks` and `POST/DELETE /tasks/:id/done` in `api/src/routes/tasks.js`, `listTasks` + done functions in `api/src/repos/tasks.js`, `api/src/lib/dates.js` (Bangkok "today", `days_left`), `api/prisma/schema.prisma` (the tables)
- **Be ready to explain:** the three tabs, Overdue / Today / … groups and colors, ticking done, pull to refresh; how done is per student (`task_done` table)

## Member 3 (Kimmy): Managing tasks (detail + add / edit / delete)
- **Flutter (`app/lib/`):** `screens/task_detail_screen.dart`, `screens/task_form_screen.dart`, `utils/dates.dart`, `services/api_service.dart` (create / update / delete)
- **Backend:** `GET/POST/PUT/DELETE /tasks/:id` in `api/src/routes/tasks.js` (incl. `checkOwner`: 404 then 403), `validateTask` in `api/src/lib/validate.js`, `api/src/routes/courses.js` + `api/src/repos/courses.js`, create/update/delete in `api/src/repos/tasks.js`
- **Be ready to explain:** opening, adding, editing and deleting a task; why another user sees no Edit/Delete and how the server refuses with 403

## Project-wide topics (not tied to one screen)
Answers for each are in the guide's **Project-wide questions** section.
- **Member 1 (Grace):** how to run the project (`npm run dev`, `flutter run`), deploying the API to Vercel, secrets (`.env`, `.gitignore`), the extras (web version, release APK, app icon, GitHub).
- **Member 2 (Billy):** the setup files: `api/src/index.js` (Express app: cors, JSON, route order, 404/500), `api/src/db.js` + `api/prisma.config.js` (pooled vs direct database URL), `api/prisma/seed.js`, `api/scripts/check-db.js`, `api/package.json`, `app/pubspec.yaml`, the Android manifest and `build.gradle.kts`. Also: why Neon + Prisma instead of TiDB + mysql2, and how the tables were created (`prisma db push`).
- **Member 3 (Kimmy):** the overall design (why the app calls an API instead of the database), the REST design (URLs, methods, status codes), and testing ("how do you know it works?").
- **Everyone** should still be able to explain `api/src/index.js` in one sentence.

## Good to know (everyone)
- **Prisma instead of mysql2:** class used Express + mysql2 + MySQL (TiDB); we use Express + Prisma + Postgres (Neon). Be ready to say: "Prisma writes the SQL for us, the same way we wrote queries with mysql2" (`findMany` = SELECT, `create` = INSERT).
- We import `package:material_ui/material_ui.dart` instead of `flutter/material.dart` (SPEC D-36).
- Live API: https://duesoon-api.vercel.app · Web version: https://duesoon-web-phi.vercel.app
- Demo accounts: `mai@duesoon.test`, `ploy@duesoon.test`, `ton@duesoon.test`, `beam@duesoon.test`, password `demo1234`
- Demo script (Billy presents solo): [`DEMO.md`](DEMO.md). Run the app and API: see the [README](../README.md).
- All three of us share one database: adding or deleting tasks changes what everyone sees.

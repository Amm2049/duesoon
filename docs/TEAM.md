# DueSoon team split

Split by part of the app. In your part, focus on the code that uses what we were taught in class;
the rest is "it works, we didn't change it". Demo order follows the user's path: **log in → browse → manage**.

## Member 1: Getting in (start + accounts)
- **Owns:** Splash, Login, Register, Logout
- **Files (`app/lib/`):** `screens/splash_screen.dart`, `screens/login_screen.dart`, `screens/register_screen.dart`, `utils/validators.dart`, `services/session.dart`
- **Demo:** open the app, try a wrong password, register, log in, log out

## Member 2: Seeing tasks (home + lists)
- **Owns:** Home screen with This Week / All / Done, the task cards, the done checkbox
- **Files (`app/lib/`):** `screens/home_screen.dart`, `widgets/` (all), `models/`, `services/api_service.dart` (loading the lists), `utils/urgency.dart`
- **Demo:** the three tabs, Overdue / Today / … groups and colors, tick a task done, pull to refresh

## Member 3: Managing tasks (detail + add / edit / delete)
- **Owns:** Task detail, the Add/Edit form, Delete
- **Files (`app/lib/`):** `screens/task_detail_screen.dart`, `screens/task_form_screen.dart`, `services/api_service.dart` (create / update / delete)
- **Demo:** open a task, add one, edit it, delete it; show that another user sees no Edit/Delete

## Shared (no owner needed)
The API + database (`api/`), the web version, tests and docs are done and working.
In the demo: "the app talks to our Express API on Vercel, data is in a Postgres database".

## Good to know (everyone)
- Live API: https://duesoon-api.vercel.app · Web version: https://duesoon-web-phi.vercel.app
- Demo accounts: `mai@duesoon.test`, `ploy@duesoon.test`, `ton@duesoon.test`, `beam@duesoon.test`, password `demo1234`
- **Learn your part:** open [`code-guide.html`](code-guide.html) in a browser and press your member button (or add `?member=1`, `2` or `3` to the address).
- Full demo script: [`DEMO.md`](DEMO.md). Run the app: see the [README](../README.md).
- We import `package:material_ui/material_ui.dart` instead of `flutter/material.dart` (SPEC D-36).
- All three of us share one database: adding or deleting tasks changes what everyone sees.

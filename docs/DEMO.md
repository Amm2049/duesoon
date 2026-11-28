# DueSoon demo script (solo presenter, about 5 minutes)

Billy presents every part. The work split comes at the end, so the professor can ask about each member's part.

Device: **emulator** on the laptop (O-04). Backup: release APK on an Android phone (`app/build/app/outputs/flutter-apk/app-release.apk`), then `docs/screenshots/` if both fail.

## Before class (10 min earlier)
1. `cd api && npx prisma db seed`: resets the shared live DB. Dates are relative to today, so every group is filled. **This deletes anything added since the last seed** (including teammates' practice tasks).
2. Open https://duesoon-api.vercel.app/ in a browser → `{"status":"ok"}`. This wakes Neon (the first request after idle can take a few seconds).
3. `flutter emulators --launch Medium_Phone_API_35`, install/open DueSoon, emulator in **light** mode.
4. Have `mai@duesoon.test` / `ploy@duesoon.test` (password `demo1234`) written down.
5. Keep https://duesoon-web-phi.vercel.app open in a browser tab as an extra backup.

## Script
| # | Do | Say |
|---|---|---|
| 1 | Open app → splash → login | "DueSoon is one shared deadline board for the class. Flutter app, Express + Prisma API on Vercel, Neon Postgres database." |
| 2 | Log in with a **wrong password** | "Same message for a wrong password or an unknown email, so nobody can find out which emails exist. Passwords are stored hashed with bcrypt." |
| 3 | Log in as **Mai** → This Week | "Login gives back a JWT token; every request after this sends it. This Week shows overdue tasks plus the next 7 days, grouped by day and colored by urgency. `days_left` comes from the server using the **Bangkok** date, so everyone agrees on 'today'." |
| 4 | Tap **All**, scroll to LATER; tap **Done** | "All is every task on the board. Done is per student: this is only Mai's list." |
| 5 | Back on **This Week**, tick a task → it moves to Done; untick it; pull down to refresh | "Ticking saves to the server first, then the list reloads, so the screen always matches the database." |
| 6 | Tap **+** → title "Demo: Lab 8", type Quiz, pick a date (show past days greyed out), Save | "The form checks the same rules as the server; the server is the real rule." |
| 7 | Open the new task → **Mark as done** → "1 classmate finished this" | "Shared count, private tick." |
| 8 | Edit the title → Save | "Only the creator sees Edit and Delete; the API also returns 403 if anyone else tries." |
| 9 | Log out → log in as **Ploy** → open "Demo: Lab 8" | "Ploy sees the count of 1, but her own button still says Mark as done, and there's no Edit/Delete." |
| 10 | Ploy taps **Mark as done** → count 2 | |
| 11 | Switch emulator to **dark mode** (quick settings) | "Colors come from the theme, with dark variants for the urgency colors." *(Skip if over time.)* |
| 12 | Log out → Mai → delete "Demo: Lab 8" (confirm dialog) | "Deleting also removes everyone's done marks." |

## End: how we split the work
Say this last, then invite questions:

> "We split the work by feature, following the user's path: **log in → see tasks → manage tasks**. Each of us built one feature end to end: the Flutter screens *and* the API routes and database code behind them.
> - **Grace (Member 1): Getting in**: splash, login, register, log out; JWT token and bcrypt password hashing on the server.
> - **Billy (Member 2): Seeing tasks**: home screen with the three tabs, day groups and urgency colors, ticking done; `GET /tasks`, the done routes, the `task_done` table, Bangkok 'today'.
> - **Kimmy (Member 3): Managing tasks**: detail page, add/edit form, delete; the server rule that only the creator can edit or delete (404, then 403).
>
> Happy to take questions on any part."

If asked **why that split**: "So each of us understands a full feature from screen to database, not just UI or just backend."

If asked about **Mark as done on the detail page**: "The button is on Kimmy's screen, but it calls my `setDone` function and my done routes. We shared one function instead of writing it twice."

## If something goes wrong
- **Spinner for long / "Couldn't load tasks"**: pull down to retry (Neon waking up).
- **No internet in class**: phone hotspot; or show the screenshots.
- **Emulator frozen**: switch to the phone with the APK, or the web version.

## After class
`cd api && npx prisma db seed` to clean up (removes "Demo: Lab 8" if it wasn't deleted).

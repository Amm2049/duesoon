# DueSoon demo script (about 5 minutes)

Device: **emulator** on the laptop (O-04). Backup: release APK on an Android phone (`app/build/app/outputs/flutter-apk/app-release.apk`), then `docs/screenshots/` if both fail.

## Before class (10 min earlier)
1. `cd api && npx prisma db seed`: resets the shared live DB. Dates are relative to today, so every group is filled. **This deletes anything added since the last seed.**
2. Open https://duesoon-api.vercel.app/ in a browser → `{"status":"ok"}`. This wakes Neon (the first request after idle can take a few seconds).
3. `flutter emulators --launch Medium_Phone_API_35`, install/open DueSoon, emulator in **light** mode.
4. Have `mai@duesoon.test` / `ploy@duesoon.test` (password `demo1234`) written down.

## Script
| # | Do | Say |
|---|---|---|
| 1 | Open app → splash → login | "One shared board for the class. Flutter app, Express + Prisma API on Vercel, Neon Postgres." |
| 2 | Log in with a **wrong password** | "Same message for wrong password and unknown email, so nobody can probe which emails exist." |
| 3 | Log in as **Mai** → This Week | "Overdue + next 7 days, grouped, colored by urgency. `days_left` comes from the server using the **Bangkok** date, so everyone agrees on 'today'." |
| 4 | Tap **All**, scroll to LATER; tap **Done** | "Done is per student: this is Mai's list." |
| 5 | Tap **+** → title "Demo: Lab 8", type Quiz, pick a date (show past days greyed out), Save | "The form checks the same rules as the server; the server is the real rule." |
| 6 | Open the new task → **Mark as done** → "1 classmate finished this" | "Shared count, private tick." |
| 7 | Edit the title → Save | "Only the creator sees Edit and Delete; the API also returns 403 if anyone else tries." |
| 8 | Log out → log in as **Ploy** → open "Demo: Lab 8" | "Ploy sees the count of 1, but her own button still says Mark as done, and no Edit/Delete." |
| 9 | Ploy taps **Mark as done** → count 2 | |
| 10 | Switch emulator to **dark mode** (quick settings) | "Colors come from the theme, with dark variants for the urgency colors." |
| 11 | Log out → Mai → delete "Demo: Lab 8" (confirm dialog) | "Deleting also removes everyone's done marks." |
| 12 | (If time) mention tests | "31 unit + 25 API tests on the server, 64 Flutter tests, and every decision is logged in the spec." |

## If something goes wrong
- **Spinner for long / "Couldn't load tasks"**: pull down to retry (Neon waking up).
- **No internet in class**: phone hotspot; or show the screenshots.
- **Emulator frozen**: switch to the phone with the APK.

## After class
`cd api && npx prisma db seed` to clean up (removes "Demo: Lab 8" if it wasn't deleted).

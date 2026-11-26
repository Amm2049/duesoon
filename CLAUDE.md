# DueSoon

Shared class deadline board: Flutter 3.50 app (`app/`) + Express 5 / Prisma 7 / Neon Postgres API in plain CommonJS JavaScript on Vercel (`api/`). Solo CSC452 project. Versions: SPEC §12.

## Session start
1. Read `docs/PROGRESS.md` (where we are) → `docs/PLAN.md` (next step) → the relevant parts of `docs/SPEC.md`.
2. `SPEC.md` wins over every other doc. Don't build against an **[Open]** item; ask.

## After every finished task or changed decision
Tick `PLAN.md`, add a dated line to `PROGRESS.md`, log decisions in `SPEC.md` §2 + change log. Say which files were updated.

## Commands
| Where | Command | What |
|---|---|---|
| api/ | `npm run dev` | local API (`node --watch src/dev.js`) |
| api/ | `PRISMA_LOG=1 npm run dev` | same, printing generated SQL |
| api/ | `vercel` | deploy a **preview** (check it with `vercel curl <url>`; previews are login-protected) |
| api/ | `vercel --prod` | deploy to production → https://duesoon-api.vercel.app (manual CLI deploy, pushing to GitHub does **not** deploy; global CLI 67.x) |
| api/ | `vercel logs --deployment duesoon-api.vercel.app --since 15m --query 'level:error'` | live error logs |
| api/ | `npm test` | unit tests (no DB) |
| api/ | `npm run test:api` | API tests: real HTTP + Neon; cleans up `apitest-*` users |
| api/ | `npx prisma db push` | apply `schema.prisma` to Neon (uses DIRECT URL) |
| api/ | `npm run db:check` | run the key list/count queries (`PRISMA_LOG=1` to print SQL) |
| api/ | `npx prisma db seed` | reset + seed demo data |
| api/ | `npx prisma studio` | browse/edit data in the browser |
| app/ | `flutter emulators --launch Medium_Phone_API_35` | start the emulator |
| app/ | `flutter run` | run app on emulator, against the **live** API (D-43) |
| app/ | `flutter run --dart-define=API_BASE=http://10.0.2.2:3000` | run against local `npm run dev` (10.0.2.2 = the PC from inside the emulator). **Untested**: Android may block plain `http://` |
| app/ | `flutter build apk --release` | release APK → `build/app/outputs/flutter-apk/app-release.apk` (demo backup, D-48) |
| app/ | `flutter build web --release` then in `build/web/`: `vercel --prod` | deploy web → https://duesoon-web-phi.vercel.app. After `flutter clean`: `vercel link --yes --project duesoon-web` + recreate `.vercelignore` (`.env*`, `.gitignore`, `*.map`) first (D-49) |
| app/ | `flutter test` | unit/widget tests |
| app/ | `flutter analyze` | lint/type check |

## Invariants (don't break these)
- User id comes **only from the JWT** (`req.user.id`), never from body/query (D-06).
- "Today" = `todayBangkok()`. Never the server's local date or SQL `CURDATE()`/`NOW()` for rules (D-12).
- Dates: Prisma `Date` ↔ `"YYYY-MM-DD"` conversion **only** via `lib/dates.js` (`toDateStr`/`fromDateStr`); API JSON carries strings (D-13).
- All Prisma calls live in `src/repos/`; routes never import Prisma. No `$queryRawUnsafe` (D-24, D-30).
- DB = snake_case, Prisma code = camelCase, API JSON = snake_case (converted in repos' `toXJson()`).
- Edit/delete: 404 if missing, then 403 if not creator, enforced on the server (D-15).
- App never computes `days_left`; it uses the API value (SPEC §5).
- Flutter colors come from `colorScheme`; only the urgency set in `utils/urgency.dart` is hard-coded, with light + dark variants (D-32).
- **Git** (D-26): private GitHub repo, branch `main`. Never commit `.env*` (except `.env.example`), `.vercel/`, `node_modules/` or build output; run `git status` before each commit and check. Commit only when the owner asks. Pushing does not deploy (Vercel is CLI-only).
- **Prisma is pinned to v7** (`prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg@7`). Never install without `@7`: npm `latest` is the v8 RC. Generator `prisma-client-js`, config `prisma.config.js`, URL not in the schema (D-34).
- Neon: app uses pooled `DATABASE_URL` (`-pooler` host); Prisma CLI uses direct `DATABASE_URL_UNPOOLED` via `prisma.config.js`. Never swap them (D-38).
- API is CommonJS JavaScript (`require`/`module.exports`), no TypeScript (D-33). Vercel entry = `src/index.js` exporting the app; no `vercel.json`, no `app.listen` there (D-37).
- Flutter imports `package:material_ui/material_ui.dart`, not `flutter/material.dart` (D-36).
- Live API shares the Neon DB with local dev (D-42): `npm run test:api` and `prisma db seed` change what the live app shows. Vercel env values are set by piping from a file, never typed/printed; `.vercelignore` must keep `.env*` out.
- Tools: course stack + Prisma, `jsonwebtoken`, `bcryptjs`. Ask before adding any other package (D-08).

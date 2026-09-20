---
name: deploy-parkit
description: Deploy the ParkIt backend API to Render (GitHub-connected, Neon Postgres). Use for requests to deploy, redeploy, or push backend changes live, or to debug a Render startup crash / EF Core migration error.
---

# Deploying ParkIt

## What's actually deployed

- **Backend API**: Render web service, built from `Source/backend/Dockerfile`, connected to the
  GitHub repo `ashokpp83/parkit-app` on branch `main`. Live at
  `https://parkit-app-l73a.onrender.com`. **Deploys are triggered manually** from the Render
  dashboard ("Manual Deploy" -> "Deploy latest commit") - pushing to `main` alone does not
  redeploy it.
- **Database**: managed **Neon PostgreSQL**. The `ConnectionStrings__Default` env var on the
  Render service is the Neon connection string.
- **Frontend**: not deployed as a hosted site. It only runs via local dev server
  (`ng serve`, port 4300) or packaged into the Android APK
  (`Source/parkit-ui/android/app/build/outputs/apk/debug/app-debug.apk`). Both point at the same
  Render API URL via `Source/parkit-ui/src/environments/environment.production.ts`.

## Before every deploy: check for pending EF Core migrations

This is the step most likely to be forgotten and it **will crash the live service**. On startup,
`Source/backend/ParkIt.Api/Program.cs` (around line 91-100) runs `db.Database.MigrateAsync()`
against the relational (Neon) provider. If any `Source/backend/ParkIt.Domain/Entities/*.cs`
change isn't captured in a migration, the container throws
`PendingModelChangesWarning: The model for context 'ApplicationDbContext' has pending changes`
and never comes up.

Whenever an entity class changed since the last migration, generate one **before** pushing.
Design-time migration generation doesn't need a real database connection - a syntactically valid
dummy Postgres connection string is enough to make EF pick the Npgsql provider instead of
falling back to InMemory (which can't do migrations at all):

```bash
cd Source/backend/ParkIt.Infrastructure
ConnectionStrings__Default="Host=localhost;Port=5432;Database=parkit;Username=parkit;Password=parkit" \
  dotnet ef migrations add <DescriptiveName> --startup-project ../ParkIt.Api --project .
```

Then confirm the model is fully in sync by generating one more throwaway migration:

```bash
ConnectionStrings__Default="Host=localhost;Port=5432;Database=parkit;Username=parkit;Password=parkit" \
  dotnet ef migrations add CheckPendingChanges --startup-project ../ParkIt.Api --project .
```

- If the generated `Up()`/`Down()` methods are **empty**, the model is in sync - delete that
  throwaway migration's `.cs` and `.Designer.cs` files (don't run `migrations remove`, it tries
  to connect to a real database to check applied migrations and will fail with no DB reachable).
- If it's **not empty**, there's still a real pending change - keep it (rename it something
  descriptive) instead of deleting it.

Commit the real migration's `.cs`, `.Designer.cs`, and the updated `ApplicationDbContextModelSnapshot.cs`.

## Known failure: "relation X already exists" during MigrateAsync

The Neon database's schema was originally created before EF migrations existed in this project
(likely via an old `EnsureCreatedAsync` run), so its tables exist but `__EFMigrationsHistory` has
no rows. On deploy, `MigrateAsync()` then tries to `CREATE TABLE` everything from `InitialCreate`
from scratch and crashes on the first collision, e.g.:

```
fail: ... CREATE TABLE "Disputes" ...
Unhandled exception. Npgsql.PostgresException: 42P07: relation "Disputes" already exists
```

Fix (one-time, doesn't touch real data/schema): run this against the Neon database directly
(Neon console SQL Editor, or `psql` with the same connection string as
`ConnectionStrings__Default`) to record that `InitialCreate` is already applied, so
`MigrateAsync` skips it and only applies genuinely new migrations:

```sql
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260916062509_InitialCreate', '9.0.1')
ON CONFLICT ("MigrationId") DO NOTHING;
```

Then redeploy. If a *later* migration also hits this same error (because its tables/columns were
also created out-of-band), insert its migration ID the same way instead of re-deploying blindly.

### If the schema is out of sync in more than one place: wipe and re-migrate clean

The one-off `__EFMigrationsHistory` insert above only works if that's the *only* drift between
Neon's actual schema and what the migrations expect. If the schema has drifted in multiple,
compounding ways (e.g. it was originally created via `EnsureCreatedAsync`, then further
hand-edited or partially migrated), patching history row-by-row turns into whack-a-mole. In that
situation it's faster and safer to wipe the database and let migrations rebuild it from scratch,
since this is a demo database with only seed data (`DbSeeder.cs` repopulates it automatically on
next startup):

1. In the Neon console SQL Editor (or `psql` with the `ConnectionStrings__Default` value), drop
   and recreate the `public` schema:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Redeploy (Manual Deploy -> Deploy latest commit). `MigrateAsync()` will run every migration
   (`InitialCreate`, then each subsequent one) against the empty schema in order, and
   `DbSeeder.cs` will repopulate demo accounts/data on startup.
3. Verify with the post-deploy checks below, plus a full login + data-fetch smoke test (not just
   `/health`) since this rebuilds real data, not just schema.

This was needed once (2026-09-18) when the Neon schema had drifted out of sync in more than one
place after `AddFacilityServicesAndVas` was added; wiping and clean-migrating fixed it in one
step versus patching multiple history rows.

## Deploy steps

1. `git add`/`git commit`/`git push origin main` the backend changes (including any new
   migration files from the step above).
2. Go to the Render dashboard for the `parkit-app` service -> **Manual Deploy** -> **Deploy
   latest commit**. This step is manual - there is no Render CLI/API key configured in this
   environment, so an agent cannot trigger it; a human has to click it in the dashboard.
3. Wait for the deploy to show **Live**.

## Post-deploy verification

```bash
curl -s https://parkit-app-l73a.onrender.com/health
# expect: {"status":"healthy","service":"ParkIt.Api"}
```

To confirm the *new* code is actually running (not just that the old container is still up),
hit a route that requires `[Authorize]` and exists only in the new code, with no auth header:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://parkit-app-l73a.onrender.com/api/v1/parking/facilities/00000000-0000-0000-0000-000000000000/services"
```

- `401 Unauthorized` -> the route exists, the new deploy is live.
- `404 Not Found` -> the route doesn't exist on the running container - the deploy either hasn't
  finished, wasn't triggered, or crashed on startup (check the migration-pending gotcha above
  first).

For a fuller smoke test, log in as a seeded demo account against the production URL and call a
couple of endpoints end-to-end (not just against the local InMemory dev DB):

```bash
curl -s -X POST https://parkit-app-l73a.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"owner@parkit.app","password":"Passw0rd!"}'
```

## Building the Android APK

The debug APK at
`Source/parkit-ui/android/app/build/outputs/apk/debug/app-debug.apk` is built from the Angular
production build, synced into the Capacitor Android project:

```bash
cd Source/parkit-ui
npm.cmd run build -- --configuration=production   # writes dist/parkit-ui
npx cap sync android                                # copies dist into android/app/src/main/assets/public
cd android
./gradlew.bat assembleDebug
```

### Known failure: Gradle "not a regular file" / "Unable to delete directory" on OneDrive

This repo lives under a OneDrive-synced folder. OneDrive's Files On-Demand feature can turn
freshly-written build output into cloud-only placeholders (NTFS reparse points) right after it's
written, before Gradle reads/deletes it on the next task. This has shown up in at least three
different directories so far - it's not specific to one path, it can hit *any* directory Gradle
just wrote to:

- `android/app/src/main/assets/public/*.js` (right after `cap sync`)
- `node_modules/@capacitor/*/android/build`
- `android/app/build/intermediates/incremental/packageDebug/tmp`

Gradle fails with one of:

```
java.io.IOException: Cannot snapshot ...assets\public\chunk-XXXX.js: not a regular file
```
or
```
java.io.IOException: Unable to delete directory '...\build\intermediates\...\tmp'
Failed to delete some children. This might happen because a process has files open...
```

This is **not flaky/transient** in practice - retrying the build alone does not fix it; the same
file fails every time until it's forced to hydrate locally. Confirm with PowerShell:

```bash
powershell.exe -NoProfile -Command "(Get-Item 'path\to\file').Attributes"
# if the output includes ReparsePoint, it's a OneDrive cloud-only placeholder
```

Fix: force every file in the Android assets folder (and ideally the whole `android/` tree) to be
pinned "Always keep on this device" so OneDrive stops re-virtualizing it mid-build:

```bash
cd Source/parkit-ui/android/app/src/main/assets/public
powershell.exe -NoProfile -Command "Get-ChildItem -Path '.' -Recurse -File | ForEach-Object { attrib.exe -U +P \"$($_.FullName)\" }"
```

Then re-run `./gradlew.bat assembleDebug` from `Source/parkit-ui/android`. If a different
directory is the stuck one (error message names it), the general recipe is the same three steps,
adapted to that path:

1. `./gradlew.bat --stop` (a stale daemon can independently hold its own lock).
2. `rm -rf` the specific stuck directory the error names (e.g.
   `app/build/intermediates/incremental/packageDebug/tmp`, or
   `app/build/intermediates/incremental/debug/packageDebugResources`) - don't delete all of
   `app/build`, the targeted directory is enough.
3. Retry `assembleDebug`. If it fails again on the *same* directory, pin it like the assets
   folder above; if it fails on a *new* directory each time, that's expected - OneDrive is
   re-virtualizing whatever Gradle wrote most recently, so just repeat steps 1-2 for the newly
   named directory until a run gets through cleanly (in practice this has taken 1-2 retries, not
   more).

Verify the build actually picked up the latest frontend changes by checking the APK's timestamp
against `android/app/src/main/assets/public/*` - if the APK is older than the assets, Gradle's
up-to-date check missed the change; delete `app/build/outputs/apk/debug/app-debug.apk` and rerun
`assembleDebug`.

## Render environment variables

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__Default=<Neon Postgres connection string, SSL Mode=Require>
Jwt__Issuer=ParkIt
Jwt__Audience=ParkItClients
Jwt__Key=<random secret, at least 32 characters>
FrontendOrigin=<the deployed frontend origin, once one exists>
```

The API listens on port `8080` (`ENV ASPNETCORE_HTTP_PORTS=8080` in the Dockerfile) and exposes
`GET /health` as the Render health check path.

See `Source/backend/DEPLOYMENT.md` for the original generic write-up of this same architecture.

# parkit-app

## Automated validation

GitHub Actions runs the backend tests against an isolated PostgreSQL service, checks for pending EF
Core model changes, builds the frontend, and runs its browser tests on pushes and pull requests.
The checks do not deploy the application or contact the live database, SMTP provider, or geocoding
service.

To run the checks locally:

```powershell
dotnet test Source\backend\ParkIt.Tests\ParkIt.Tests.csproj --filter 'Category!=Postgres'
$env:ConnectionStrings__Default = 'Host=localhost;Port=5432;Database=parkit;Username=parkit;Password=local'
dotnet ef migrations has-pending-model-changes --project Source\backend\ParkIt.Infrastructure --startup-project Source\backend\ParkIt.Api
Set-Location Source\parkit-ui
npm ci
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

The migration check requires the `dotnet-ef` CLI; it compares the model with the migration
snapshot and does not connect to PostgreSQL. Chrome must be installed for the browser tests;
set `CHROME_BIN` to its executable if Karma cannot find it. Email delivery and deployment
configuration must still be verified separately; see [deployment guidance](Source/backend/DEPLOYMENT.md).

To run the PostgreSQL persistence test locally, provision a **dedicated disposable** PostgreSQL
database, set `PARKIT_TEST_DATABASE` to its connection string, then run:

```powershell
dotnet test Source\backend\ParkIt.Tests\ParkIt.Tests.csproj --filter 'Category=Postgres'
```

The test applies migrations and writes test accounts and vehicles. Never point it at a live or
shared database.
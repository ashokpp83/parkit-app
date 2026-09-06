# Low-cost cloud deployment

## Recommended MVP architecture

- Deploy `backend/` as a container to Render or another low-cost .NET container host.
- Create a managed PostgreSQL database on Neon or Supabase.
- Deploy the Angular `parkit-ui` build as static HTTPS hosting.
- Configure the API's `FrontendOrigin` to the exact PWA origin.

Free tiers are suitable for demos and low traffic. They may sleep, have limited storage, and do not provide production-grade availability.

## API environment variables

Configure these variables on the API host:

```text
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__Default=Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require
Jwt__Issuer=ParkIt
Jwt__Audience=ParkItClients
Jwt__Key=<random-secret-at-least-32-characters>
FrontendOrigin=https://your-pwa-domain.example
```

The API listens on port `8080` and exposes `GET /health`.

## Build and deploy

From the `backend` directory:

```powershell
docker build -t parkit-api .
docker run --rm -p 8080:8080 `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e ConnectionStrings__Default="..." `
  -e Jwt__Key="..." `
  -e FrontendOrigin="https://your-pwa-domain.example" `
  parkit-api
```

Set the service health check path to `/health` in the hosting provider.

## Frontend wiring

Set `src/environments/environment.production.ts` to the public API URL, then build:

```powershell
cd parkit-ui
npm.cmd run build
```

Deploy `dist/parkit-ui/browser` to an HTTPS static host. Configure SPA fallback to `index.html` and install the PWA from the deployed HTTPS domain.

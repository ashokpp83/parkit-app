# Low-cost cloud deployment

> This is deployed today on Render (GitHub-connected) with Neon PostgreSQL. For the concrete,
> tested deploy steps and the EF Core migration gotcha, see the `deploy-parkit` skill at
> `Source/.claude/skills/deploy-parkit/SKILL.md`.

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
Smtp__Host=<smtp-host>
Smtp__Port=587
Smtp__Username=<smtp-username>
Smtp__Password=<smtp-password>
Smtp__From=<verified-sender-email>
```

The API listens on port `8080` and exposes `GET /health`.

Password recovery requires an SMTP provider supporting STARTTLS and a publicly reachable HTTPS
`FrontendOrigin` serving the Angular app with SPA fallback. Configure SMTP credentials as secrets
on the host, never in the repository. Reset links expire after 30 minutes and can be used once.
The API applies the EF Core password-reset migration at startup. Production requires the PostgreSQL
connection string; the in-memory development database is not persistent.

Location search uses the public Nominatim service through a cached, rate-limited API proxy. Review its
[usage policy](https://operations.osmfoundation.org/policies/nominatim/) before deployment:
autocomplete is prohibited, traffic from the entire application is limited to one request per
second, and applications must be able to switch provider. Run **only one API instance** while
using this proxy: its rate limit and cache are local to the process. For multiple instances, use
a shared rate limiter/cache or a different provider. Set `Geocoding__BaseUrl` to an alternative
Nominatim-compatible HTTPS service if needed. Addresses are sent to the configured provider.

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

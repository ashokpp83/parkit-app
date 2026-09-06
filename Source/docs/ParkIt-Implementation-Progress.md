# ParkIt — Implementation Progress

> Living log of what has actually been built, how to run it, and decisions/gotchas worth remembering.
> Planning docs (`ParkIt-App-Plan.md`, `docs/ParkIt-API-Specification.md`, `docs/ParkIt-Database-Schema.md`,
> `docs/ParkIt-Phase1-Sprint-Plan.md`) describe the target system; this file tracks the MVP slice actually implemented.

---

## 1. Scope built so far

A compiling, runnable two-sided foundation with role-based access:

**Car owner:** Register/Login (JWT) -> Add vehicle -> Search parking on a free map -> Book a space -> View bookings  
**Facility owner:** Register/Login (JWT) -> Manage owned facilities -> View booking history for owned facilities

Backend: .NET 9 Clean Architecture. Frontend: Angular 19 standalone. Local DB: SQLite (Postgres+PostGIS is the
documented production target in the schema doc, not yet wired up).

---

## 2. Architecture

### Backend — `Source/backend/`
- **ParkIt.Domain** — entities (`BaseEntity`, `User`, `Vehicle`, `ParkingProvider/Facility/Space`, `Booking`, etc.)
  and enums (`Enums.cs`). Enums are stored as **int** in the DB (ordinal), not string — see gotcha below.
- **ParkIt.Application** — use-case services, DTOs, abstractions (`IApplicationDbContext`, `ICurrentUser`),
  `AuthService`, `VehicleService`, `ParkingService` (search via Haversine + SQL bounding-box prefilter),
  `BookingService`, `GeoUtil`, `AppException` / `PagedResult` common types.
- **ParkIt.Infrastructure** — EF Core 9 + SQLite `ApplicationDbContext`, entity `Configurations`, JWT
  `TokenService` + `JwtSettings`, `PasswordHasher` (aliases ASP.NET Identity's `PasswordHasher<User>` as
  `IdentityHasher` to avoid a name collision with the app's own hasher), `DbSeeder` (demo data), EF migrations.
- **ParkIt.Api** — `Program.cs` wiring, `ExceptionMiddleware` (`{ error: { code, message } }` envelope),
  `CurrentUser` (reads claims), controllers: `AuthController`, `VehiclesController`, `ParkingController`,
  `BookingsController`. CORS allows `localhost:4200`, `4300`, `8100`.

### Frontend — `Source/parkit-ui/src/`
- Angular 19, **standalone components + signals**, functional HTTP interceptor, lazy routes, `CanActivateFn` guard.
- `environments/environment.ts` — `apiBaseUrl: http://localhost:5080/api/v1`.
- `app/core/` — `models.ts` (DTOs/enums mirrored from backend), `auth.service.ts` (localStorage keys
  `parkit.access` / `parkit.refresh` / `parkit.user`), `auth.interceptor.ts`, `auth.guard.ts`,
  `parking.service.ts`, **`geocoding.service.ts`** (new — see §4).
- `app/features/auth/` — `login.component.ts`, `register.component.ts`.
- `app/features/search/search.component.ts` — **Find Parking** screen: address search + free map + results
  (see §4 for the latest changes).
- `app/features/bookings/bookings.component.ts` — my bookings list.
- `app/features/owner/owner-facilities.component.ts` — owner-only facility management (add/edit) + owner booking history.
- `app/{app.routes.ts, app.config.ts, app.component.ts}`, `styles.scss` (dark theme, Leaflet CSS import,
  `.map-wrap` / `.pin` / `.suggestions` styles).

---

## 3. Demo credentials & how to run

**Demo driver login:** `driver@parkit.app` / `Passw0rd!`

Backend:
```
source /c/Users/Ashok.Parasuraman/nenv.sh   # REQUIRED first — see gotcha below
cd Source/backend/ParkIt.Api
dotnet run   # http://localhost:5080
```

Frontend:
```
source /c/Users/Ashok.Parasuraman/nenv.sh
cd Source/parkit-ui
npm start -- --port 4300   # port 4200 was taken by another local app ("Axcess Scan")
```

Then open `http://localhost:4300/search`.

---

## 4. Find Parking screen — free, open-source map + address search

Two user requests drove this screen's current shape:
1. *"show maps with default maps features which is available free to the user"*
2. *"instead of latitude and longitude, ask for address or location to enter from user"*

**Stack — 100% open source, no API key, no billing account:**
| Piece | Library | License |
|---|---|---|
| Map engine | Leaflet 1.9.4 | BSD-2-Clause |
| Map tiles/data | OpenStreetMap | Open Database License (ODbL) |
| Address search (geocoding) | Nominatim (OSM's public geocoder) | Open source, free public API |

**What's on the screen:**
- A single **"Location or address"** text box (no more raw lat/lng inputs).
  - Debounced (350ms) autocomplete against Nominatim as you type; results shown in a `.suggestions` dropdown.
  - Selecting a suggestion recenters the map, updates the "Showing parking near …" label, and re-runs the search.
  - Enter key geocodes the typed text and jumps to the best match.
  - By default, the map now starts from the browser's current location (fallback to Anna Nagar if unavailable).
  - **📍 button** — browser geolocation -> reverse-geocode (Nominatim `/reverse`) to a friendly label -> search.
- **Radius (km)** field (unchanged).
- Leaflet map with OSM tiles, zoom controls, "© OpenStreetMap contributors" attribution.
- A blue circle marker at the search center; **🛡-badged "P" pins** color-coded by `SpaceStatus`
  (Guaranteed / LikelyAvailable / Full). Clicking a pin opens a popup to view facility details.
- Result cards below the map (facility, slot, distance, price, security 🛡 rating, "View facility" action).
- Booking now asks the driver for **hours to book** after showing selected-facility features and pricing.

**New file:** `app/core/geocoding.service.ts`
- `search(query, limit=5)` -> `GET https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&...`
- `reverse(lat, lng)` -> `GET https://nominatim.openstreetmap.org/reverse?format=jsonv2&...`
- Biased to India (`countrycodes=in`) since that's the app's target market — remove if going global.
- Nominatim's usage policy caps free public use at ~1 req/sec; the 350ms debounce keeps normal typing under that.
  **For production traffic, self-host a Nominatim instance or use another OSM-based geocoder** (e.g. Photon,
  Pelias) rather than hitting the public endpoint directly.

**Rewritten file:** `app/features/search/search.component.ts` — replaced lat/lng inputs with address + map UX,
default current-location centering, and a selected-facility booking panel with user-entered booking hours.

**Styles added** (`styles.scss`): `.field.grow`, `.autocomplete`, `.input-row`, `.suggestions` (dropdown list,
positioned absolutely under the input, dark theme to match the rest of the app).

---

## 5. Key decisions & gotchas (read before touching this code)

- **No Write/Edit tools available in this environment** — all files are created/edited via Bash heredocs.
  Large heredocs (~200+ lines) have intermittently failed with `unexpected EOF` for no clear syntactic reason;
  the reliable pattern is to write in **smaller chunks** (~40-70 lines) using `cat > file` for the first chunk
  and `cat >> file` to append the rest.
- **No Python in this environment** — use Node (`node -e '...'`) for any scripting/text-munging needs.
- **Shell is missing Windows env vars by default.** Always run
  `source /c/Users/Ashok.Parasuraman/nenv.sh` before any `dotnet`, `npm`, or `ng` command, or you'll get
  cryptic failures (e.g. NuGet "Value cannot be null (Parameter 'path1')", `dotnet-ef` NullReferenceException
  from missing `PATHEXT`).
- **Enums are stored as int**, not string, in EF Core — do not add `.HasConversion<string>()` for enum
  properties; it broke existing `(int)` comparisons in query filters.
- **`PasswordHasher` name collision** — ASP.NET Identity's `PasswordHasher<User>` is aliased as
  `IdentityHasher` in Infrastructure to coexist with the app's own `PasswordHasher` class.
- **`@` in Angular templates** is control-flow syntax (`@if`, `@for`) — literal `@` in text (e.g. an email
  placeholder) must be escaped as `&#64;`.
- **Port 4200 is taken** by an unrelated local app ("Axcess Scan") — ParkIt's dev server runs on **4300**,
  which is already added to the API's CORS allow-list alongside 4200/8100.
- **Browser automation click helper is flaky on this page** (`clickElement` times out waiting for "stability",
  likely due to Leaflet's tile/zoom animations). When it happens, either use `typeInPage` with `key: "Enter"`
  to submit, or fall back to `runPlaywrightCode` with a direct `page.$eval(selector, el => el.click())`.

---

## 6. Verification performed

- **Backend, via curl:** login returns access+refresh tokens; `/auth/me` returns the demo user; authed
  `/parking/search?lat=13.085&lng=80.21&radiusKm=3` returns 2 seeded spaces at Anna Nagar Tower Parking
  (Slot P-12 Guaranteed ₹40/hr 🛡4/5, Slot EV-03 Likely ₹60/hr 🛡5/5) with correct distances.
- **Driver booking flow:** booking returns ₹180 total with `isGuaranteed` flag, 15-min grace period, and a QR payload.
- **Role-based access rules:** driver-only access for Find/Bookings and owner-only access for Facilities.
- **Owner bookings:** `/bookings/owner` returns historical bookings for spaces owned by the authenticated owner.
- **Frontend, in-browser (Playwright tooling):**
  - Login screen renders; login succeeds; session persists in `localStorage`.
  - `/search` renders the Leaflet/OSM map with 2 status-colored pins + matching result cards.
  - Typing **"T Nagar, Chennai"** in the address box returned 3 real Nominatim suggestions; selecting one
    recentered the map onto real T Nagar streets (Sir Thyagaraya Rd, Nathamuni St) and correctly returned
    "No spaces yet" (the only seeded parking is in Anna Nagar, outside T Nagar's 3km radius) — confirms the
    address→coordinates→search pipeline is wired correctly end-to-end.
  - Confirmed 📍 location button and 🛡 shield-rating icons render after the address-search rewrite.

## 7. Pending / suggested next steps

- Wire up **Postgres + PostGIS** for production (schema doc already specifies spatial columns/indexes);
  SQLite + Haversine bounding-box is a local-dev stand-in only.
- Consider self-hosting Nominatim (or switching to Photon/Pelias) before any real production traffic, per
  the usage-policy note in §4.
- Owner-side flows now include facility listing/creation/editing, owner booking history, and role-scoped navigation;
  admin approval and earnings dashboard are still pending.
- Payments, QR check-in/out UI, Parking Guarantee failover UI, notifications, disputes — all documented in
  `docs/ParkIt-API-Specification.md` §§5-14 but not yet implemented.

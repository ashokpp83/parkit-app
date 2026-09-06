# ParkIt — Phase 1 (MVP) Sprint Breakdown

> Goal: ship a functioning two-sided MVP (Driver + Owner) with the **Parking Guarantee**
> as the core differentiator. Assumes 2-week sprints and a small cross-functional team
> (Angular/Ionic devs, .NET devs, QA, designer). Adjust velocity to your team size.

---

## Sprint 0 — Foundation & Setup (2 weeks)
**Goal:** environments, scaffolding, CI/CD.

- [ ] Set up Git repo, branch strategy, PR templates.
- [ ] Scaffold **.NET 8 Clean Architecture** solution (API / Application / Domain / Infrastructure).
- [ ] Scaffold **Angular + Ionic + Capacitor** app; base routing, theming, i18n skeleton.
- [ ] Provision Azure resources: App Service, PostgreSQL, Redis, Blob Storage, App Insights.
- [ ] CI/CD pipelines (build/test/deploy) via GitHub Actions or Azure DevOps.
- [ ] Configure Swagger/OpenAPI, Serilog, health checks.
- [ ] EF Core setup + initial migration (empty baseline).

**Exit:** empty app deploys to dev; API responds to `/health`.

---

## Sprint 1 — Identity, Roles & Vehicles (2 weeks)
**Goal:** users can register, log in, manage vehicles.

- [ ] ASP.NET Identity + JWT (access/refresh), role-based auth (Driver/Owner/Admin).
- [ ] OTP send/verify (SMS gateway integration).
- [ ] `Users`, `Vehicles` entities + migrations.
- [ ] Endpoints: `/auth/*`, `/users/me`, `/vehicles/*`.
- [ ] Angular: registration, login, OTP, profile, add/manage vehicle screens.
- [ ] Secure token storage (Capacitor Secure Storage).

**Exit:** driver registers, logs in, adds a vehicle end-to-end.

---

## Sprint 2 — Owner Onboarding & Space Inventory (2 weeks)
**Goal:** owners can list spaces (pending approval).

- [ ] `ParkingProviders`, `ParkingFacilities`, `ParkingSpaces`, `SpaceAmenities`, `SpaceAvailability`, `PricingRules` entities.
- [ ] Owner KYC submission + Blob upload for documents/space photos.
- [ ] Endpoints: `/owner/providers`, `/owner/facilities`, `/owner/spaces/*`, verification upload.
- [ ] PostGIS spatial column + GIST index on facility location.
- [ ] Angular Owner flow: create facility, add space (type, price, amenities, availability), upload photos.

**Exit:** owner submits a space; it sits in "pending approval".

---

## Sprint 3 — Admin Approval & Discovery/Search (2 weeks)
**Goal:** approved spaces are discoverable on the map.

- [ ] Admin portal (basic web/Angular): pending listings, approve/reject.
- [ ] Endpoints: `/admin/listings/*`, `/parking/search`, `/parking/facilities/{id}`, `/parking/spaces/{id}`.
- [ ] Spatial radius search + filters (price, type, amenities, vehicle compatibility).
- [ ] Availability status model (??/??/??) computed from availability windows + bookings.
- [ ] Angular Driver flow: Google Maps view, filters, space detail screen.

**Exit:** approved space appears in driver search and map.

---

## Sprint 4 — Bookings & Reservation Rules (2 weeks)
**Goal:** driver can reserve a space with time slots.

- [ ] `Bookings` entity + overlap/availability validation.
- [ ] Reservation grace period / timeout (background job via Hangfire/Quartz).
- [ ] Endpoints: `/bookings`, `/bookings/{id}`, cancel, extend.
- [ ] Cancellation & refund policy logic; owner instant notification.
- [ ] Angular: booking flow (time slot picker), my bookings list, booking detail.

**Exit:** driver books a space; owner is notified; grace-period auto-release works.

---

## Sprint 5 — Payments, Wallet & Payouts (2 weeks)
**Goal:** secure paid bookings and owner payouts.

- [ ] Payment gateway integration (Razorpay/Stripe) — UPI/card/wallet.
- [ ] `Payments`, `Payouts`, `Wallets` entities; escrow/hold-until-checkout logic.
- [ ] Webhook handling + idempotency keys.
- [ ] Endpoints: `/payments/*`, `/wallet/*`, `/owner/payouts`.
- [ ] Angular: payment UI, wallet, receipts/history.
- [ ] Conditional reservation deposit for free parking (revised policy).

**Exit:** paid booking completes; payment held; payout scheduled.

---

## Sprint 6 — QR Check-in/out & Parking Guarantee Engine (2 weeks)
**Goal:** the core differentiator works end-to-end.

- [ ] `CheckInCheckOutLogs` entity; QR generation (offline-capable payload).
- [ ] Attendant Mode (simplified scan-and-validate screen).
- [ ] Endpoints: `/bookings/{id}/qr`, checkin, checkout.
- [ ] **Parking Guarantee Engine**: report-unavailable ? find alternatives ? transfer ? refund diff.
- [ ] SignalR hubs: availability, guarantee failover, booking status.
- [ ] Angular: QR display (cached offline via IndexedDB), failover flow UI.

**Exit:** check-in via QR; guarantee failover finds and transfers to an alternative.

---

## Sprint 7 — Trust Layer: No-Show, Overstay, Reliability, Reviews (2 weeks)
**Goal:** fairness rules and reputation.

- [ ] No-show detection (grace + partial payout) — background job.
- [ ] Overstay handling (charges + owner alert + extend prompts).
- [ ] Owner cancellation penalties.
- [ ] `ReliabilityScores` (owner + driver) recalculation job.
- [ ] `Reviews` (both directions) + endpoints.
- [ ] Angular: reliability score display, review submission.

**Exit:** no-show/overstay rules enforce automatically; scores update.

---

## Sprint 8 — Monthly Parking, Notifications & Disputes (2 weeks)
**Goal:** recurring revenue + support workflows.

- [ ] `SubscriptionPlans` (hourly/daily/weekly/monthly + auto-renew) + renewal job.
- [ ] Digital Parking Pass (QR).
- [ ] Notifications: Push (FCM) + SMS/WhatsApp fallback for critical events.
- [ ] `Disputes` entity + endpoints; admin resolution workflow.
- [ ] Basic fraud flags (duplicate listing, multiple accounts).
- [ ] Angular: subscription flow, notification center, dispute raise screen.

**Exit:** monthly subscription with auto-renew; disputes raised and resolved.

---

## Sprint 9 — Hardening, UAT & Launch Prep (2 weeks)
**Goal:** production-ready MVP.

- [ ] End-to-end testing across driver/owner/admin/attendant roles.
- [ ] Offline scenarios (basement QR access), low-network fallback validation.
- [ ] Load test toward 10k concurrent users; tune Redis caching + indexes.
- [ ] Security review: encryption, token handling, payment PCI scope.
- [ ] App Store / Play Store build, signing, store listings.
- [ ] Multilingual pass (English, Hindi, Tamil).
- [ ] UAT sign-off + bug fixes.

**Exit:** MVP released to pilot city/store.

---

## MVP Definition of Done
- Driver: search ? book ? pay ? QR check-in/out ? rate, with guarantee failover.
- Owner: KYC ? list space ? get approved ? receive bookings ? view earnings ? get payout.
- Admin: approve listings, resolve disputes, view analytics.
- Attendant: scan-and-validate bookings.
- Non-functional: offline QR, SMS/WhatsApp fallback, encryption, 99.5% uptime target.

---

## Suggested Team & Parallelization
| Track | Owner | Runs across |
|---|---|---|
| Backend/API | .NET devs | Sprints 1–8 |
| Mobile UI | Angular/Ionic devs | Sprints 1–8 |
| Admin/Operator portal | 1 Angular dev | Sprints 3, 8 |
| QA/Automation | QA | Sprints 2–9 |
| DevOps | Shared | Sprints 0, 9 |

> Backend and mobile tracks work in parallel each sprint against agreed API contracts
> (defined in `ParkIt-API-Specification.md`).

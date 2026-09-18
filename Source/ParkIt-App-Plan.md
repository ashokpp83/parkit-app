# ParkIt � India's Smart Parking Marketplace
## Consolidated Project Plan

---

## 1. Product Vision & Positioning

**Not:** "A parking booking app."
**Instead:** *"India's Smart Parking Marketplace"* � a two-sided network connecting parking
supply (individuals, societies, offices, malls, municipalities) with demand (drivers), backed
by a core trust promise: the **Parking Guarantee**.

| Audience | Value Proposition |
|---|---|
| Drivers | Guaranteed parking wherever you go |
| Parking owners | Turn unused parking space into passive income |
| Parking operators | Manage, monetize, and optimize every parking space |
| Cities/Municipalities | Digitize and optimize parking supply |

### Core Differentiators
1. **??? Parking Guarantee** � booked space is verified reserved, not just "shown as available."
2. **?? Owner Income Marketplace** � AI-driven earnings estimation turns idle space into a business.
3. **Network effect** � residential, commercial, municipal, and event parking unified in one marketplace.

---

## 2. Introduction (Original Scope)

### 2.1 Purpose
Help users find, reserve, and pay for parking efficiently; enable individuals to rent unused
private parking spaces for income; provide value-added services (car wash, insurance renewal,
FASTag/e-toll recharge).

### 2.2 Scope
- Public vs. private, free vs. paid parking differentiation.
- Real-time discovery with price, location, amenities.
- Peer-to-peer (P2P) parking rentals.
- Online booking, reservation, secure payments.
- Customer & owner profiles, notifications, mutual alerts.
- Admin dashboard for approvals, disputes, analytics.
- Value-added services.
- Android 9+ / iOS 14+, Google Maps integration.

---

## 3. Competitive Landscape Summary

| App | Strength | Gap ParkIt Should Exploit |
|---|---|---|
| Park+ | Super-app (FASTag, insurance) | Weak P2P, no owner monetization |
| ParkingPal | Guaranteed booking | Limited amenities/EV support |
| Parke | Simple search?book?QR flow | No P2P, no monthly plans |
| ParkIN24 | Two-app model (driver + owner), full feature set | Chennai-only � ParkIt can go pan-India with richer trust/reliability features |
| Paarking | Valet + events | Inconsistent live availability |
| BookMySpace | P2P monetization focus | Weak discovery/live availability |

**Conclusion:** No competitor combines *guaranteed availability + strong owner monetization +
verification/trust layer + monthly/recurring/event parking* in one platform. This is ParkIt's
opening.

---

## 4. Functional Requirements (Consolidated)

### 4.1 Core Discovery & Categorization
- Ownership: Public vs. Private
- Cost: Free vs. Paid
- Access: Open vs. Reserved
- Facilities: EV charging, handicapped access, two-wheeler, covered/uncovered
- Visual distinction via icons/labels/colors
- **Availability status tiers (new core concept):**
  - ?? **Guaranteed** � reserved & verified
  - ?? **Likely available** � based on live/estimated occupancy
  - ?? **Full** � no booking possible
- Vehicle compatibility & physical constraints (hatchback/sedan/SUV/EV/commercial; length, width, height, turning radius, ramp/basement restrictions)

### 4.2 Parking Guarantee Engine (New � P0)
When booked: `Booking ID ? Space ? Vehicle ? Time Window ? Owner ? Entry` is guaranteed.
If space unavailable on arrival, automated workflow:
1. Detect failed parking ? 2. Contact owner ? 3. Resolution window ? 4. Search alternatives ?
5. Offer alternative ? 6. Transfer booking ? 7. Refund difference ? 8. Compensation/credit ?
9. Record owner reliability impact.

### 4.3 Peer-to-Peer (P2P) Parking Rentals
- Listing form: location, availability, price, space type.
- **Owner KYC** (mobile, email, identity, bank, address verification, ownership declaration).
- **Space verification**: entrance photo, slot photo, surroundings, dimensions, CCTV evidence (manual/AI-assisted review).
- Admin approval required before going live.
- Owners manage availability/pricing/removal anytime.
- Secure owner payouts.

### 4.4 Parking Space Discovery
- Interactive map (Google Maps).
- Per-space: location, type, price, availability window, amenities.
- Filters: price, distance, type, amenities.
- **"Parking + Destination" UX**: user specifies destination first; app ranks parking by walk time, price, guarantee status.
- **True Availability calculation** (Phase 2+): owner input + bookings + check-in/out + IoT/ANPR + historical usage ? estimated real availability.

### 4.4a Compare Parking Options (New)
- From search results, user shortlists 2�3 parking spaces and opens a side-by-side **Compare**
  view: price, distance, availability status, rating per option.
- Direct "Book" CTA from the comparison screen to skip returning to the results list.

### 4.5 Reservations & Bookings
- Advance reservation with time slot (start/end).
- Upfront payment for paid spots.
- Instant owner notification.
- Cancellation with refund policy.
- **Reservation grace period / timeout** (e.g., 15 min) before auto-release.
- **No-show policy**: grace period, partial payment to owner, customer reliability impact.
- **Overstay management**: extend-parking prompts, overstay charges, owner alerts.
- **Owner cancellation protection**: penalty for late cancellation, ranking/suspension for repeat offenders.

### 4.6 Payments
- UPI, cards, wallets; **cash + digital record** for attendant-assisted lots.
- **Saved payment methods**: view/add/remove cards for faster checkout (not one-off entry each time).
- Owner payouts after commission; payout protection messaging ("secured until check-in/check-out").
- Payment history & receipts.
- In-app wallet for faster payouts.
- **Revenue models**: commission-based, subscription-based (owner pays flat fee, keeps revenue), hybrid.

### 4.7 User Profiles & Roles
- **Login**: password or mobile **OTP** as an alternate/second login factor (in addition to OTP already used for KYC verification).
- **Car owners**: find/book, history, ratings.
- **Parking space owners**: list/manage spaces, view earnings.
- **Value-added services users**: car wash, insurance, e-toll recharge.
- Ratings & reviews both directions.
- **Owner Reliability Score** (booking honoured %, space-available-on-arrival %, response time, cancellation rate, cleanliness, security) � replaces simple star ratings.
- **Customer Reliability Score** (no-shows, late departures, cancellations, payment behavior, disputes).
- **Guest parking**: book on behalf of another driver/vehicle.

### 4.8 Notifications & Mutual Alerts
- Real-time alerts: booking, cancellation, expiry.
- Owner alerted on rental.
- Mutual alerts between owner and driver.
- **Fallback channels**: Push + SMS + WhatsApp for critical events (network resilience for India).

### 4.9 Admin Dashboard & Operator Portals
- Approve/reject listings, manage bookings/payments/disputes.
- Analytics: earnings, usage trends, availability stats.
- **Separate portals**: Owner Portal (individual), Operator Portal (commercial), Admin Portal (platform), Municipal Portal (future).
- **Dispute management** with defined categories (space unavailable, owner cancellation, no-show, vehicle damage, wrong charge, overstay, security, wrong location, unauthorized vehicle, fraudulent listing) ? Evidence ? SLA ? Resolution ? Refund/Penalty.
- **Fraud detection**: fake listings/reviews, duplicate spaces, multiple accounts, chargebacks, GPS spoofing, deposit abuse.

### 4.10 Free Parking Deposit � Revised
- Reconsidered from mandatory ?10/hour universal deposit ? **optional "reservation/commitment deposit"** applied only when necessary (e.g., high-demand free lots), refunded automatically after verified checkout, to reduce payment friction and adoption barriers.

### 4.11 Value-Added Services
- **Facility-owned catalog, not global**: each parking facility has its own value-added services catalog. The facility owner chooses which service types to offer *at that specific location* and sets that facility's own price per service, with an edit option at any time. Nothing is enabled by default; a service only appears for car owners once its facility owner turns it on. This models VAS as facility-specific (e.g. a surface lot may only offer car wash, while a covered multi-level facility may also offer EV charging and tire change), since not every service is physically deliverable at every location.
- Catalog types: car wash (exterior only, or interior + exterior), insurance renewal, FASTag/e-toll recharge, bookable EV charging tiers (Level 1 standard / Level 2 fast - distinct from EV charging as a parking amenity in 4.1), tire change, oil change, roadside assistance, car accessories, car detailing.
- **Insurance coverage types**: Comprehensive, Liability, Collision, Uninsured Motorist - presented as selectable plans within the insurance VAS.
- **Roles**: the facility owner *manages* the catalog (select service + set price per facility) but does not "book" their own services - the owner's view is read-only cost/detail information plus the list of bookings placed against their facility. The car owner *browses* a chosen facility's enabled services and books directly, paying the facility owner's set price (server-priced from the facility's catalog entry, never client-supplied).
- **Booking updates the facility**: when a car owner books a value-added service, the booking is recorded against that specific facility (not a global service ledger), so the facility owner's booking list for that facility updates immediately, showing who booked what and at what price.
- **Bundled into the parking booking flow**: when a car owner opens a facility to reserve a slot, that facility's enabled VAS catalog (with owner-set prices) is shown inline in the same booking panel as optional add-ons. Any selected services are booked automatically alongside the parking reservation - no separate trip to a standalone services page is required. The car owner still has a dedicated Services tab to browse/manage bookings by facility at any time, independent of an active parking booking.
- **Combined cost shown before paying**: the booking panel and the payment step both show a running breakdown - Parking cost + Services cost = Total - so the car owner sees the full amount before confirming. The payment gateway currently only charges the parking amount (services are confirmed directly with the facility); this is called out explicitly in the payment step so the total isn't mistaken for a single combined charge.
- **Facility owner's booking history reflects service revenue too**: the owner's Booking History list shows each parking booking's amount alongside that customer's value-added service spend at the same facility (Parking + Services = Total), correlated by facility and customer, so the owner isn't only seeing the base parking amount for a customer who also paid for services.
- **Advertisements/Offers Hub (Phase 2)**: promotional surface (Featured Offers + More Deals carousels) aggregating VAS promos and third-party parking-related deals/discounts.

### 4.12 Parking Amenities & Security
- CCTV **optional, not mandatory** (unrealistic for residential owners) � modeled as a **Security Level (attributes: CCTV, guard, gated, access-controlled, lit, residential/basement)** score, e.g., 4/5.
- Covered/uncovered selection.
- 24/7 availability where applicable.

### 4.13 Ratings & Health Score
- Parking Lot Ratings: cleanliness, security, amenities.
- **Parking Health Score** (0�100): availability accuracy, booking success, cleanliness, security, complaints, cancellations, entry/exit experience, payment issues � a stronger decision signal than star ratings alone.

### 4.14 Vehicle Damage Protection (New)
- Digital check-in/out with timestamped photos (front/rear/left/right).
- Before/after comparison; dispute workflow with evidence.

### 4.15 Digital Vehicle Check-in / ANPR (Phased)
- QR / number-plate based check-in and automatic checkout for accurate occupancy data.
- ANPR integration at participating facilities (Phase 2/3).

### 4.16 Monthly / Recurring / Commuter Parking (New � Major Gap Filled)
- Hourly | Daily | Weekly | **Monthly**, with auto-renew.
- **Commuter parking**: recurring weekday bookings with savings vs. daily rate.
- **Digital Parking Pass** for recurring users (QR/ANPR access).
- **Subscription plans**: daily commuter, resident, corporate, night, weekend.

### 4.17 Event, Corporate, Society, Hospital, Airport, Railway, Religious-Place Parking (Phase 2/3)
- Event Parking Mode with staggered exit recommendations.
- Corporate Parking (employee/visitor/reserved/EV/guest management) � potential B2B revenue.
- Residential Society Parking Marketplace (with society approval, resident verification, guest access, time restrictions).
- Office parking sharing (after-hours/weekends).
- Hospital, Airport (short/long-term, park & ride, valet), Railway (commuter plans), Temple/religious-place demand prediction.

### 4.18 Navigation & "Last 100 Metres"
- Entrance/gate/level/slot-level navigation beyond generic map pin.
- "Find My Car" (non-AR MVP version): stores parked location for retrieval.
- "Don't circle around" mode: reroute to next-best parking if selected space becomes unavailable (Phase 2).

### 4.19 Access Instructions (P2P Essential)
- Gate/remote access, security contact, slot location, lift availability, owner instructions � captured as part of booking.

### 4.20 Special-Situation Filters
- Family, Accessibility, Women Safety, EV, Shopping, Hospital-specific filters.

### 4.21 Smart Pricing & AI (Phase 2/3)
- Smart Pricing Assistant (suggested price based on nearby demand; time-based rules).
- AI Parking Assistant (demand prediction, probability-based recommendations).
- Availability Probability (%) instead of binary available/unavailable where sensors are absent.
- Parking Cost Optimizer (total cost: fee + fuel + time trade-offs).

### 4.22 Valet Marketplace (Phase 2/3)
- Booking ? valet assignment ? tracking ? digital inspection ? handover/return.

### 4.23 Multilingual & Attendant Mode
- English, Hindi, Tamil (Phase 1); expand to regional languages.
- Simplified **Parking Attendant Mode**: scan booking ? validate vehicle/slot/time, no complex dashboard.

### 4.24 Municipal Integration & Enforcement (Phase 3, Legally Governed)
- Architecture to support municipal/traffic-police/smart-city data sources from day one.
- Parking rule alerts (time-restricted zones); AI-camera-based enforcement (future, subject to legal/municipal authorization).
- Towing escalation workflow (Owner ? Security ? Operator ? Enforcement) � implemented only with proper authorization.

---

## 5. Non-Functional Requirements
- **Performance:** Support ?10,000 concurrent users.
- **Reliability:** 99.5% uptime.
- **Security:** End-to-end encryption for user/payment data.
- **Scalability:** Support onboarding additional parking providers/operators over time.
- **Usability:** Fast booking/listing flows.
- **Compatibility:** Android 9+, iOS 14+.
- **Resilience:** Offline/low-network support � booking QR, slot info, access instructions, and payment status must remain accessible without connectivity (critical for basements).

---

## 6. Tech Stack

### 6.1 Frontend (Mobile UI)
| Concern | Choice |
|---|---|
| Framework | Angular (latest LTS) |
| Mobile packaging | Ionic Framework + Capacitor (single Angular codebase ? Android & iOS) |
| State management | NgRx (bookings, listings, session, live availability); Angular Signals for local component state |
| UI styling | Angular Material / Ionic Components + SCSS |
| Maps | Google Maps SDK (`@capacitor/google-maps` or `angular-google-maps`) |
| Real-time | `@microsoft/signalr` client for live availability, guarantee-engine alerts, mutual alerts |
| Push notifications | Firebase Cloud Messaging (FCM) via Capacitor plugin |
| Payments | Razorpay/Stripe SDK (UPI, cards, wallets); cash-with-digital-record flow |
| Auth | JWT + refresh tokens (password or mobile OTP login), stored via Capacitor Secure Storage |
| Offline support | Angular Service Worker + IndexedDB for cached booking QR/details |
| Multilingual | Angular `i18n` / `ngx-translate` |
| Camera/QR | Capacitor Camera plugin (vehicle check-in photos, QR scanning) |

### 6.2 Backend (.NET Core)
| Concern | Choice |
|---|---|
| Framework | ASP.NET Core Web API (.NET 8 LTS) |
| Architecture | Clean Architecture (API / Application / Domain / Infrastructure) |
| Database | PostgreSQL + PostGIS (recommended for geo-spatial parking queries) via EF Core, or SQL Server + spatial types |
| Auth | ASP.NET Core Identity + JWT (access + refresh tokens); password or SMS-OTP login; role-based (Driver, Owner, Operator, Admin, Attendant) |
| Real-time | SignalR hubs for live availability, guarantee-engine events, mutual alerts |
| Payments | Razorpay/Stripe server-side integration + payout/escrow handling |
| Caching | Redis (availability queries, pricing suggestions, session data) |
| Background jobs | Hangfire or Quartz.NET (no-show detection, overstay checks, subscription renewals, reliability score recalculation) |
| Notifications | FCM (push) + SMS gateway (e.g., MSG91/Twilio) + WhatsApp Business API |
| Search | Elasticsearch or PostGIS spatial queries for "parking near destination" |
| API docs | Swagger / OpenAPI |
| Fraud/ML (Phase 2/3) | ML.NET or Azure Cognitive Services integration for listing verification, ANPR |

### 6.3 DevOps / Infrastructure
- **Hosting:** Azure App Service (API), Azure Static Web Apps (if web companion), Azure Database for PostgreSQL.
- **CI/CD:** Azure DevOps Pipelines or GitHub Actions.
- **Containerization:** Docker for consistent deployment across environments.
- **Monitoring:** Application Insights, structured logging (Serilog).
- **Storage:** Azure Blob Storage for verification photos, damage-protection images.

---

## 7. High-Level Architecture

```
flowchart TB
    subgraph Mobile["Mobile Apps (Angular + Ionic/Capacitor)"]
        DriverApp["Driver App"]
        OwnerApp["Owner App"]
        AttendantApp["Attendant Mode"]
    end

    subgraph Backend[".NET Core Backend (Clean Architecture)"]
        API["ASP.NET Core Web API"]
        Auth["Identity + JWT + Role-based Auth"]
        Hub["SignalR Hubs (availability, alerts, guarantee events)"]
        GuaranteeEngine["Parking Guarantee Engine"]
        Pricing["Smart Pricing / AI Recommendation Service"]
        Jobs["Background Jobs (no-show, overstay, renewals, scoring)"]
        BLL["Application / Domain Layer"]
        DAL["EF Core Data Access"]
    end

    subgraph Infra["Infrastructure & Integrations"]
        DB[("PostgreSQL + PostGIS")]
        Cache[("Redis")]
        Blob[("Blob Storage - verification photos")]
        Payment["Payment Gateway (Razorpay/Stripe)"]
        Maps["Google Maps API"]
        Push["FCM Push"]
        SMS["SMS/WhatsApp Gateway"]
        ANPR["ANPR/IoT (Phase 2-3)"]
        Municipal["Municipal/Smart-City APIs (Phase 3)"]
    end

    DriverApp --> API
    OwnerApp --> API
    AttendantApp --> API
    DriverApp --> Hub
    OwnerApp --> Hub

    API --> Auth
    API --> GuaranteeEngine
    API --> Pricing
    API --> BLL --> DAL --> DB
    BLL --> Cache
    BLL --> Blob
    API --> Payment
    API --> Push
    API --> SMS
    Jobs --> BLL
    GuaranteeEngine --> Hub

    API -.Phase 2/3.-> ANPR
    API -.Phase 3.-> Municipal
```

---

## 8. Data Model � Key Design Principle

Do **not** model around a single "Parking Lot" entity. Model around **Parking Space
Inventory**, since a single provider may have multiple levels/zones:

```
Parking Facility
   ??? Level 1
   ?    ??? Slot 001
   ?    ??? Slot 002
   ??? Level 2
   ?    ??? Slot 101
   ??? EV Area
        ??? EV01
```

Each individual **Space** entity should carry: availability, price, vehicle compatibility,
booking status, owner reference, security attributes, amenities, dimensions, access rules,
time restrictions, verification status, and sensor/ANPR status. This keeps the schema
extensible for commercial, municipal, and event-parking providers later.

### Core Entities (initial)
`User (Driver/Owner/Operator/Admin/Attendant)`, `Vehicle`, `ParkingProvider`, `ParkingFacility`,
`ParkingSpace`, `Booking`, `Payment`, `Payout`, `Review`, `ReliabilityScore`, `Dispute`,
`Notification`, `SubscriptionPlan`, `VerificationRecord`, `CheckInCheckOutLog`.

---

## 9. Parking Provider Types (Onboarding Model)
Individual � Apartment/Society � Office � Mall � Hotel � Restaurant � Hospital � School/College �
Municipality � Parking Operator � Event Organizer � Airport � Railway Station � each with
different management capabilities in the Operator Portal.

---

## 10. Feature Roadmap by Phase

### ?? Phase 1 (MVP � P0, Must-Have)
1. Real-time availability (??/??/?? status model)
2. Advance booking & Parking Guarantee Engine (core version)
3. Owner KYC & space verification (manual review)
4. QR-based booking/access, check-in/check-out
5. No-show, overstay, and cancellation rules (both sides)
6. Owner earnings dashboard & reliability score
7. Vehicle registration & compatibility checks
8. Navigation to actual entrance (basic � entrance/gate/slot text guidance)
9. Payments (UPI/card/wallet, saved payment methods) + admin dispute management
10. Fraud protection basics, admin moderation dashboard
11. Monthly parking (hourly/daily/weekly/monthly + auto-renew)
12. Compare parking options (side-by-side price/distance/availability/rating)

### ?? Phase 2 (Major Differentiators)
- Commuter/recurring bookings, parking subscriptions
- Smart Pricing Assistant, availability-probability predictions
- Event parking, corporate parking, society parking marketplace
- EV charging integration, valet marketplace
- Parking Health Score, vehicle damage protection (photo check-in/out)
- Parking attendant mode, guest parking, emergency parking
- SMS/WhatsApp fallback notifications, multilingual support (Hindi, Tamil)
- Expanded value-added services catalog (tiered EV charging, tire change, oil change, roadside assistance, car accessories, car detailing) + Advertisements/Offers hub

### ?? Phase 3 (Strategic / Long-Term)
- ANPR & smart gate integration
- IoT occupancy sensors, AI-based enforcement
- Municipal/smart-city integration
- Predictive demand modeling, "don't circle around" rerouting
- Automated towing-escalation workflows (with legal authorization)
- Advanced AR navigation, vehicle/infotainment integration

---

## 11. User Roles & Portals
- **Driver App**: search, compare, book, pay, rate, navigate, manage vehicles.
- **Owner App**: list/manage spaces, view earnings, pricing assistant, reliability score.
- **Attendant Mode**: simplified QR-scan validation UI.
- **Admin Portal**: approvals, disputes, fraud monitoring, analytics.
- **Operator Portal** (Phase 2): for commercial/multi-facility providers (malls, hospitals, corporates).
- **Municipal Portal** (Phase 3): public/traffic authority integration.

---

## 12. User Stories (Representative)
- As a driver, I want to see guaranteed parking nearby so I can park without uncertainty.
- As a driver, I want monthly commuter parking so I don't rebook daily.
- As an owner, I want an earnings estimator before listing so I understand the income potential.
- As an owner, I want protection against no-shows so I don't lose booked revenue.
- As an admin, I want dispute workflows with evidence so resolutions are fair and auditable.
- As a driver, I want offline access to my booking QR so basement parking with no signal still works.

---

## 13. Key Risks & Mitigations
| Risk | Mitigation |
|---|---|
| "Available" ? actually available (reservation failure) | Parking Guarantee Engine with automated re-routing/compensation |
| P2P listing fraud/fake spaces | Owner KYC + space verification + fraud detection rules |
| Payment friction on free parking | Revise mandatory deposit to conditional/optional reservation fee |
| Basement network dead zones | Offline QR caching + SMS/WhatsApp fallback |
| Owner abandoning bookings late | Owner cancellation penalty & ranking impact |
| Driver no-shows blocking inventory | Grace period + no-show policy + reliability scoring |

---

## 14. Next Steps
1. Validate MVP (Phase 1) scope and prioritize P0 features for the first release.
2. Finalize database choice (PostgreSQL+PostGIS vs. SQL Server) based on geo-query needs.
3. Define exact commission/subscription revenue model for owners.
4. Design entity schema starting from **Parking Space Inventory** model (Section 8).
5. Set up Angular + Ionic/Capacitor project scaffold and .NET Core Clean Architecture solution.
6. Identify Payment Gateway and SMS/WhatsApp provider suited for the target launch city/region.

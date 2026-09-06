# ParkIt � REST API Endpoint Specification

> Base URL: `/api/v1`
> Auth: JWT Bearer (access + refresh). Roles: `Driver`, `Owner`, `Operator`, `Admin`, `Attendant`.
> All responses JSON. Standard error envelope: `{ "error": { "code", "message", "details" } }`.

---

## 1. Authentication & Identity

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register (Driver/Owner) with role |
| POST | `/auth/otp/send` | Public | Send phone OTP |
| POST | `/auth/otp/verify` | Public | Verify OTP |
| POST | `/auth/login` | Public | Login ? access + refresh tokens |
| POST | `/auth/refresh` | Public | Exchange refresh token |
| POST | `/auth/logout` | Authenticated | Revoke refresh token |
| GET | `/auth/me` | Authenticated | Current user profile |

---

## 2. User Profile & KYC

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/users/me` | Authenticated | Get profile |
| PUT | `/users/me` | Authenticated | Update profile / language |
| POST | `/users/me/kyc` | Owner | Submit KYC documents |
| GET | `/users/me/kyc/status` | Owner | KYC verification status |
| GET | `/users/{id}/reliability` | Authenticated | Reliability score breakdown |

---

## 3. Vehicles

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/vehicles` | Driver | List my vehicles |
| POST | `/vehicles` | Driver | Add vehicle (with dimensions) |
| PUT | `/vehicles/{id}` | Driver | Update vehicle |
| DELETE | `/vehicles/{id}` | Driver | Remove vehicle |
| POST | `/vehicles/{id}/verify` | Driver | Submit for verification |

---

## 4. Parking Discovery & Search

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/parking/search` | Authenticated | Search by lat/lng radius + filters (price, type, amenities, vehicleType) |
| GET | `/parking/near-destination` | Authenticated | Rank by walk time/price/guarantee for a destination |
| GET | `/parking/facilities/{id}` | Authenticated | Facility details + spaces |
| GET | `/parking/facilities/my` | Owner | List facilities owned by the authenticated owner |
| POST | `/parking/facilities` | Owner | Create a facility with location/capacity/pricing/features |
| PUT | `/parking/facilities/{id}` | Owner | Edit an owned facility |
| GET | `/parking/spaces/{id}` | Authenticated | Space detail (amenities, access instructions, compatibility) |
| GET | `/parking/spaces/{id}/availability` | Authenticated | Availability windows + current status |
| GET | `/parking/spaces/{id}/availability-probability` | Authenticated | Predicted availability % (Phase 2) |
| POST | `/parking/emergency` | Driver | Find immediate guaranteed parking within radius |

---

## 5. Owner � Facilities & Spaces

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/owner/providers` | Owner | Register a provider profile |
| GET | `/owner/facilities` | Owner/Operator | List my facilities |
| POST | `/owner/facilities` | Owner/Operator | Create facility (location, capacity, pricing, amenities) |
| POST | `/owner/facilities/{id}/spaces` | Owner/Operator | Add parking space |
| PUT | `/owner/spaces/{id}` | Owner/Operator | Update space (price, availability, amenities) |
| DELETE | `/owner/spaces/{id}` | Owner/Operator | Remove listing |
| POST | `/owner/spaces/{id}/verification` | Owner | Upload space verification photos |
| GET | `/owner/spaces/{id}/pricing-suggestion` | Owner | Smart Pricing Assistant suggestion |
| POST | `/owner/earnings/simulate` | Owner | Earnings simulator (location/type/availability ? estimate) |
| GET | `/owner/earnings/dashboard` | Owner | Today/month earnings, occupancy, bookings, rating |

---

## 6. Bookings & Reservations

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/bookings` | Driver | Create booking (space, vehicle, time window, guest) |
| GET | `/bookings` | Driver | List my bookings |
| GET | `/bookings/{id}` | Driver | Booking details + QR |
| POST | `/bookings/{id}/cancel` | Driver | Cancel with refund policy |
| POST | `/bookings/{id}/extend` | Driver | Extend (overstay avoidance) |
| GET | `/bookings/{id}/qr` | Driver | Offline-capable QR payload |
| POST | `/bookings/{id}/checkin` | Attendant/System | Check-in (QR/ANPR/manual) |
| POST | `/bookings/{id}/checkout` | Attendant/System | Check-out |
| POST | `/bookings/{id}/damage-evidence` | Driver/Attendant | Upload check-in/out photos |
| GET | `/bookings/owner` | Owner | Booking history for my facilities |

---

## 7. Parking Guarantee Engine

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/bookings/{id}/report-unavailable` | Driver | Trigger guarantee failover |
| GET | `/bookings/{id}/failover/alternatives` | Driver | Nearby guaranteed alternatives |
| POST | `/bookings/{id}/failover/accept` | Driver | Accept alternative + transfer booking |

---

## 8. Payments, Wallet & Payouts

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/payments/initiate` | Driver | Initiate payment for a booking |
| POST | `/payments/webhook` | Gateway | Payment gateway callback |
| GET | `/payments/history` | Driver/Owner | Payment history + receipts |
| GET | `/wallet` | Authenticated | Wallet balance |
| POST | `/wallet/topup` | Authenticated | Add funds |
| GET | `/owner/payouts` | Owner | Payout history/status |

---

## 9. Subscriptions & Passes

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/subscriptions/plans` | Authenticated | Available plans |
| POST | `/subscriptions` | Driver | Subscribe (monthly/commuter/etc.) |
| POST | `/subscriptions/{id}/auto-renew` | Driver | Toggle auto-renew |
| GET | `/subscriptions/{id}/pass` | Driver | Digital parking pass (QR/ANPR) |

---

## 10. Ratings, Reviews & Health

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/reviews` | Driver/Owner | Submit review (both directions) |
| GET | `/parking/spaces/{id}/reviews` | Authenticated | Reviews for a space |
| GET | `/parking/facilities/{id}/health-score` | Authenticated | Parking Health Score breakdown |

---

## 11. Notifications & Alerts

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | List notifications |
| POST | `/notifications/{id}/read` | Authenticated | Mark as read |
| POST | `/alerts/mutual` | Driver/Owner | Send alert to counterpart |
| POST | `/devices/register` | Authenticated | Register FCM device token |

---

## 12. Disputes

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/disputes` | Driver/Owner | Raise dispute (category + evidence) |
| GET | `/disputes` | Authenticated | My disputes |
| GET | `/disputes/{id}` | Authenticated | Dispute detail/status |

---

## 13. Value-Added Services

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/services` | Authenticated | List services (car wash, insurance, FASTag) |
| POST | `/services/book` | Authenticated | Book a value-added service |
| GET | `/services/bookings` | Authenticated | My service bookings |

---

## 14. Admin & Operator

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/admin/listings/pending` | Admin | Listings awaiting approval |
| POST | `/admin/listings/{id}/approve` | Admin | Approve listing |
| POST | `/admin/listings/{id}/reject` | Admin | Reject listing |
| GET | `/admin/disputes` | Admin | Manage disputes |
| POST | `/admin/disputes/{id}/resolve` | Admin | Resolve dispute |
| GET | `/admin/analytics` | Admin | Earnings/usage/availability analytics |
| GET | `/admin/fraud/flags` | Admin | Fraud detection flags |
| GET | `/operator/facilities` | Operator | Multi-facility management |

---

## 15. Real-Time (SignalR Hubs)

| Hub | Event | Direction | Description |
|---|---|---|---|
| `/hubs/availability` | `SpaceStatusChanged` | Server?Client | Live ??/??/?? updates |
| `/hubs/alerts` | `MutualAlert` | Bidirectional | Owner?driver messaging |
| `/hubs/guarantee` | `GuaranteeFailover` | Server?Client | Failover/alternative offered |
| `/hubs/booking` | `BookingStatusChanged` | Server?Client | Confirm/check-in/expiry |

---

## 16. Conventions
- **Pagination:** `?page=1&pageSize=20`, responses include `totalCount`.
- **Filtering:** query params; complex search via POST body where needed.
- **Idempotency:** `Idempotency-Key` header on `POST /bookings` and `/payments/initiate`.
- **Versioning:** URL-based (`/api/v1`).
- **Rate limiting:** per-user + per-IP; stricter on auth/OTP endpoints.

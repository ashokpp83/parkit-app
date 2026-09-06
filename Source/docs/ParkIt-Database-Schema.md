# ParkIt — Database Schema & ER Design

> Design principle: model around **Parking Space Inventory**, not a single "Parking Lot".
> Target: PostgreSQL + PostGIS (spatial) via EF Core. Field types shown are logical.

---

## 1. Entity Relationship Diagram

```
erDiagram
    USER ||--o{ VEHICLE : owns
    USER ||--o{ PARKING_PROVIDER : registers
    USER ||--o{ BOOKING : makes
    USER ||--o{ REVIEW : writes
    USER ||--o{ RELIABILITY_SCORE : has
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ VERIFICATION_RECORD : submits
    USER ||--o{ WALLET : has

    PARKING_PROVIDER ||--o{ PARKING_FACILITY : owns
    PARKING_FACILITY ||--o{ PARKING_SPACE : contains
    PARKING_SPACE ||--o{ SPACE_AMENITY : has
    PARKING_SPACE ||--o{ SPACE_AVAILABILITY : defines
    PARKING_SPACE ||--o{ PRICING_RULE : priced_by
    PARKING_SPACE ||--o{ BOOKING : reserved_in
    PARKING_SPACE ||--o{ VERIFICATION_RECORD : verified_by

    BOOKING ||--|| PAYMENT : paid_by
    BOOKING ||--o{ CHECKIN_CHECKOUT_LOG : logs
    BOOKING ||--o{ DISPUTE : may_raise
    BOOKING ||--o{ DAMAGE_EVIDENCE : records
    BOOKING }o--|| VEHICLE : uses

    PAYMENT ||--o{ PAYOUT : settles
    SUBSCRIPTION_PLAN ||--o{ BOOKING : covers
    USER ||--o{ SUBSCRIPTION_PLAN : subscribes

    VALUE_ADDED_SERVICE ||--o{ SERVICE_BOOKING : booked_as
    USER ||--o{ SERVICE_BOOKING : orders
```

---

## 2. Core Tables

### 2.1 `Users`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| FullName | varchar(150) | |
| Email | varchar(255) | unique |
| PhoneNumber | varchar(20) | unique, OTP-verified |
| PasswordHash | text | ASP.NET Identity |
| Role | enum | Driver, Owner, Operator, Admin, Attendant |
| KycStatus | enum | Unverified, Partial, Verified |
| ReliabilityScore | decimal(5,2) | denormalized cache |
| PreferredLanguage | varchar(10) | en, hi, ta |
| CreatedAt / UpdatedAt | timestamptz | |

### 2.2 `Vehicles`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| UserId | uuid (FK) | |
| RegistrationNumber | varchar(20) | e.g., TN38XX1234 |
| Type | enum | Hatchback, Sedan, SUV, MUV, Luxury, EV, Commercial, TwoWheeler |
| Length / Width / Height | decimal(5,2) | metres, for compatibility |
| IsVerified | bool | |

### 2.3 `ParkingProviders`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| OwnerUserId | uuid (FK) | |
| ProviderType | enum | Individual, Society, Office, Mall, Hotel, Restaurant, Hospital, School, Municipality, Operator, EventOrganizer, Airport, RailwayStation |
| BusinessName | varchar(200) | |
| KycStatus | enum | Unverified, Partial, Verified |
| RevenueModel | enum | Commission, Subscription, Hybrid |

### 2.4 `ParkingFacilities`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| ProviderId | uuid (FK) | |
| Name | varchar(200) | |
| AddressText | text | |
| Location | geography(Point) | PostGIS, for spatial queries |
| EntranceLocation | geography(Point) | "last 100 metres" |
| AccessInstructions | text | gate/remote/lift/guard |
| HealthScore | decimal(5,2) | denormalized |

### 2.5 `ParkingSpaces`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| FacilityId | uuid (FK) | |
| Level | varchar(20) | e.g., B2 |
| SlotLabel | varchar(20) | e.g., P-27 |
| Ownership | enum | Public, Private |
| CostType | enum | Free, Paid |
| AccessType | enum | Open, Reserved |
| CoveredType | enum | Covered, Uncovered |
| MaxVehicleType | enum | compatibility ceiling |
| MaxHeight / MaxLength / MaxWidth | decimal(5,2) | |
| SecurityLevel | smallint | 1–5 (derived from amenities) |
| VerificationStatus | enum | Verified, Partial, Unverified |
| CurrentStatus | enum | Guaranteed, LikelyAvailable, Full |
| SensorEnabled / AnprEnabled | bool | phase 2/3 |

### 2.6 `SpaceAmenities`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| SpaceId | uuid (FK) | |
| Amenity | enum | EVCharging, HandicappedAccess, TwoWheeler, CCTV, Guard, Gated, WellLit, Lift |

### 2.7 `SpaceAvailability`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| SpaceId | uuid (FK) | |
| DayOfWeek | smallint | 0–6, null = all |
| StartTime / EndTime | time | availability window |
| IsRecurring | bool | |

### 2.8 `PricingRules`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| SpaceId | uuid (FK) | |
| Unit | enum | Hour, Day, Week, Month |
| BasePrice | decimal(10,2) | |
| DayOfWeek / TimeBand | | dynamic/time-based pricing |
| SuggestedPrice | decimal(10,2) | Smart Pricing Assistant |

---

## 3. Booking & Transaction Tables

### 3.1 `Bookings`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| DriverUserId | uuid (FK) | |
| SpaceId | uuid (FK) | |
| VehicleId | uuid (FK) | |
| GuestName | varchar(150) | nullable (guest parking) |
| SubscriptionPlanId | uuid (FK) | nullable |
| StartTime / EndTime | timestamptz | |
| Status | enum | Pending, Confirmed, CheckedIn, Completed, Cancelled, NoShow, Overstay, GuaranteeFailover |
| GraceExpiresAt | timestamptz | reservation timeout |
| IsGuaranteed | bool | |
| CreatedAt | timestamptz | |

### 3.2 `Payments`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| BookingId | uuid (FK) | |
| Amount | decimal(10,2) | |
| Method | enum | UPI, Card, Wallet, Cash, FASTag |
| Status | enum | Pending, Held, Captured, Refunded, PartialRefund, Failed |
| CommissionAmount | decimal(10,2) | |
| DepositAmount | decimal(10,2) | refundable reservation deposit |
| GatewayReference | varchar(100) | |

### 3.3 `Payouts`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| OwnerUserId | uuid (FK) | |
| PaymentId | uuid (FK) | |
| Amount | decimal(10,2) | after commission |
| Status | enum | Scheduled, Released, OnHold, Failed |
| ReleasedAt | timestamptz | after verified check-in/out |

### 3.4 `CheckInCheckOutLogs`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| BookingId | uuid (FK) | |
| Event | enum | CheckIn, CheckOut |
| Method | enum | QR, ANPR, Manual, Sensor |
| Timestamp | timestamptz | |
| DetectedPlate | varchar(20) | nullable |

---

## 4. Trust, Safety & Support Tables

### 4.1 `ReliabilityScores`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| UserId | uuid (FK) | owner or driver |
| BookingHonouredPct | decimal(5,2) | |
| AvailableOnArrivalPct | decimal(5,2) | owner |
| ResponseTimePct | decimal(5,2) | owner |
| CancellationRatePct | decimal(5,2) | |
| NoShowRatePct | decimal(5,2) | driver |
| UpdatedAt | timestamptz | recalculated by job |

### 4.2 `Reviews`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| BookingId | uuid (FK) | |
| ReviewerUserId | uuid (FK) | |
| Cleanliness / Security / Amenities | smallint | 1–5 |
| Comment | text | |

### 4.3 `Disputes`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| BookingId | uuid (FK) | |
| Category | enum | SpaceUnavailable, OwnerCancellation, NoShow, VehicleDamage, WrongCharge, Overstay, Security, WrongLocation, UnauthorizedVehicle, FraudulentListing |
| Status | enum | Open, UnderReview, Resolved, Rejected |
| SlaDueAt | timestamptz | |
| Resolution | text | |

### 4.4 `DamageEvidence`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| BookingId | uuid (FK) | |
| Phase | enum | CheckIn, CheckOut |
| Side | enum | Front, Rear, Left, Right |
| BlobUrl | text | |
| CapturedAt | timestamptz | |

### 4.5 `VerificationRecords`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| SubjectType | enum | OwnerKyc, SpaceVerification, VehicleVerification |
| SubjectId | uuid | |
| DocumentType | enum | Identity, Bank, Address, EntrancePhoto, SlotPhoto |
| BlobUrl | text | |
| Status | enum | Pending, Approved, Rejected |

---

## 5. Subscription & Value-Added Tables

### 5.1 `SubscriptionPlans`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| UserId | uuid (FK) | |
| SpaceId | uuid (FK) | nullable |
| PlanType | enum | DailyCommuter, Resident, Corporate, Night, Weekend, Monthly |
| Price | decimal(10,2) | |
| AutoRenew | bool | |
| ValidFrom / ValidTo | date | |

### 5.2 `Wallets`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| UserId | uuid (FK) | |
| Balance | decimal(10,2) | |

### 5.3 `ValueAddedServices` / `ServiceBookings`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| ServiceType | enum | CarWash, InsuranceRenewal, FastagRecharge |
| UserId | uuid (FK) | |
| Amount | decimal(10,2) | |
| Status | enum | Requested, InProgress, Completed, Cancelled |

### 5.4 `Notifications`
| Column | Type | Notes |
|---|---|---|
| Id | uuid (PK) | |
| UserId | uuid (FK) | |
| Channel | enum | Push, SMS, WhatsApp, InApp |
| Type | enum | Booking, Cancellation, Expiry, Alert, Payout, GuaranteeFailover |
| Payload | jsonb | |
| SentAt / ReadAt | timestamptz | |

---

## 6. Indexing & Performance Notes
- **Spatial GIST index** on `ParkingFacilities.Location` and `EntranceLocation` for radius/"near destination" queries.
- Composite index on `Bookings (SpaceId, StartTime, EndTime, Status)` for overlap/availability checks.
- Index on `Bookings (Status, GraceExpiresAt)` for the no-show/timeout background job.
- Cache hot availability data in **Redis** keyed by facility + time window.
- Use `jsonb` for flexible notification payloads and audit metadata.

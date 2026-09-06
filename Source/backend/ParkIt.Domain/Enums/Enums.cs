namespace ParkIt.Domain.Enums;

public enum UserRole { Driver = 0, Owner = 1, Operator = 2, Admin = 3, Attendant = 4 }
public enum KycStatus { Unverified = 0, Partial = 1, Verified = 2 }

public enum VehicleType { Hatchback, Sedan, SUV, MUV, Luxury, EV, Commercial, TwoWheeler }

public enum ProviderType { Individual, Society, Office, Mall, Hotel, Restaurant, Hospital, School, Municipality, Operator, EventOrganizer, Airport, RailwayStation }
public enum RevenueModel { Commission, Subscription, Hybrid }

public enum Ownership { Public, Private }
public enum CostType { Free, Paid }
public enum AccessType { Open, Reserved }
public enum CoveredType { Covered, Uncovered }
public enum VerificationStatus { Unverified, Partial, Verified }
public enum SpaceStatus { Guaranteed, LikelyAvailable, Full }
public enum AmenityType { EVCharging, HandicappedAccess, TwoWheeler, CCTV, Guard, Gated, WellLit, Lift, Hours24x7 }
public enum PricingUnit { Hour, Day, Week, Month }

public enum BookingStatus { Pending, Confirmed, CheckedIn, Completed, Cancelled, NoShow, Overstay, GuaranteeFailover }
public enum PaymentMethod { UPI, Card, Wallet, Cash, FASTag }
public enum PaymentStatus { Pending, Held, Captured, Refunded, PartialRefund, Failed }
public enum PayoutStatus { Scheduled, Released, OnHold, Failed }
public enum CheckEvent { CheckIn, CheckOut }
public enum CheckMethod { QR, ANPR, Manual, Sensor }

public enum DisputeCategory { SpaceUnavailable, OwnerCancellation, NoShow, VehicleDamage, WrongCharge, Overstay, Security, WrongLocation, UnauthorizedVehicle, FraudulentListing }
public enum DisputeStatus { Open, UnderReview, Resolved, Rejected }
public enum DamagePhase { CheckIn, CheckOut }
public enum DamageSide { Front, Rear, Left, Right }

public enum SubjectType { OwnerKyc, SpaceVerification, VehicleVerification }
public enum DocumentType { Identity, Bank, Address, EntrancePhoto, SlotPhoto }
public enum VerificationRecordStatus { Pending, Approved, Rejected }

public enum SubscriptionPlanType { DailyCommuter, Resident, Corporate, Night, Weekend, Monthly }
public enum NotificationChannel { Push, SMS, WhatsApp, InApp }
public enum NotificationType { Booking, Cancellation, Expiry, Alert, Payout, GuaranteeFailover }
public enum ValueAddedServiceType { CarWash, InsuranceRenewal, FastagRecharge }
public enum ServiceBookingStatus { Requested, InProgress, Completed, Cancelled }

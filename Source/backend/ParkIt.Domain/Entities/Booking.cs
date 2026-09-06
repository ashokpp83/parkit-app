using ParkIt.Domain.Common;
using ParkIt.Domain.Enums;

namespace ParkIt.Domain.Entities;

public class Booking : BaseEntity
{
    public Guid DriverUserId { get; set; }
    public User? DriverUser { get; set; }
    public Guid SpaceId { get; set; }
    public ParkingSpace? Space { get; set; }
    public Guid VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public string? GuestName { get; set; }
    public Guid? SubscriptionPlanId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateTime? GraceExpiresAt { get; set; }
    public bool IsGuaranteed { get; set; }
    public decimal Amount { get; set; }
    public string? QrToken { get; set; }

    public Payment? Payment { get; set; }
    public ICollection<CheckInCheckOutLog> CheckLogs { get; set; } = new List<CheckInCheckOutLog>();
}

public class Payment : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking? Booking { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal CommissionAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public string? GatewayReference { get; set; }
    public ICollection<Payout> Payouts { get; set; } = new List<Payout>();
}

public class Payout : BaseEntity
{
    public Guid OwnerUserId { get; set; }
    public Guid PaymentId { get; set; }
    public Payment? Payment { get; set; }
    public decimal Amount { get; set; }
    public PayoutStatus Status { get; set; } = PayoutStatus.Scheduled;
    public DateTime? ReleasedAt { get; set; }
}

public class CheckInCheckOutLog : BaseEntity
{
    public Guid BookingId { get; set; }
    public Booking? Booking { get; set; }
    public CheckEvent Event { get; set; }
    public CheckMethod Method { get; set; } = CheckMethod.QR;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? DetectedPlate { get; set; }
}

public class Review : BaseEntity
{
    public Guid BookingId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public short Cleanliness { get; set; }
    public short Security { get; set; }
    public short Amenities { get; set; }
    public string? Comment { get; set; }
}

public class Dispute : BaseEntity
{
    public Guid BookingId { get; set; }
    public DisputeCategory Category { get; set; }
    public DisputeStatus Status { get; set; } = DisputeStatus.Open;
    public DateTime? SlaDueAt { get; set; }
    public string? Description { get; set; }
    public string? Resolution { get; set; }
}

public class DamageEvidence : BaseEntity
{
    public Guid BookingId { get; set; }
    public DamagePhase Phase { get; set; }
    public DamageSide Side { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;
}

public class SubscriptionPlan : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? SpaceId { get; set; }
    public SubscriptionPlanType PlanType { get; set; }
    public decimal Price { get; set; }
    public bool AutoRenew { get; set; }
    public DateOnly ValidFrom { get; set; }
    public DateOnly ValidTo { get; set; }
}

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public NotificationChannel Channel { get; set; } = NotificationChannel.InApp;
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Payload { get; set; } = "{}"; // jsonb in Postgres
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
}

public class ServiceBooking : BaseEntity
{
    public Guid UserId { get; set; }
    public ValueAddedServiceType ServiceType { get; set; }
    public decimal Amount { get; set; }
    public ServiceBookingStatus Status { get; set; } = ServiceBookingStatus.Requested;
}

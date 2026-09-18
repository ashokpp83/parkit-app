using ParkIt.Domain.Common;
using ParkIt.Domain.Enums;

namespace ParkIt.Domain.Entities;

/// <summary>A platform user. Each account is exactly one role: Driver, Owner, Operator, Admin, or Attendant.</summary>
public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Driver;
    public KycStatus KycStatus { get; set; } = KycStatus.Unverified;
    public bool PhoneVerified { get; set; }
    public decimal ReliabilityScore { get; set; } = 100m; // denormalized cache
    public string PreferredLanguage { get; set; } = "en";

    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public Wallet? Wallet { get; set; }
}

public class Vehicle : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public VehicleType Type { get; set; }
    public decimal? Length { get; set; }
    public decimal? Width { get; set; }
    public decimal? Height { get; set; }
    public bool IsVerified { get; set; }
}

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public bool IsActive => RevokedAt is null && DateTime.UtcNow < ExpiresAt;
}

public class Wallet : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public decimal Balance { get; set; }
}

public class ReliabilityScore : BaseEntity
{
    public Guid UserId { get; set; }
    public decimal BookingHonouredPct { get; set; }
    public decimal AvailableOnArrivalPct { get; set; }
    public decimal ResponseTimePct { get; set; }
    public decimal CancellationRatePct { get; set; }
    public decimal NoShowRatePct { get; set; }
}

/// <summary>Phone OTP challenge used during registration/login.</summary>
public class OtpChallenge : BaseEntity
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Consumed { get; set; }
}

/// <summary>A card/UPI/wallet saved for faster checkout. Only display-safe, tokenized data is stored -
/// never a raw card number or CVV; GatewayToken is the opaque reference returned by the payment gateway.</summary>
public class SavedPaymentMethod : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public PaymentMethod Method { get; set; }
    public string? Brand { get; set; }
    public string? Last4 { get; set; }
    public byte? ExpiryMonth { get; set; }
    public short? ExpiryYear { get; set; }
    public string? GatewayToken { get; set; }
    public bool IsDefault { get; set; }
}

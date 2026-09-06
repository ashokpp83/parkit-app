using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ParkIt.Domain.Entities;

namespace ParkIt.Infrastructure.Persistence;

public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        e.Property(x => x.Email).HasMaxLength(255).IsRequired();
        e.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        e.Property(x => x.PreferredLanguage).HasMaxLength(10);
        e.Property(x => x.ReliabilityScore).HasPrecision(5, 2);
        e.HasIndex(x => x.Email).IsUnique();
        e.HasIndex(x => x.PhoneNumber).IsUnique();
        e.HasMany(x => x.Vehicles).WithOne(v => v.User!).HasForeignKey(v => v.UserId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.RefreshTokens).WithOne(t => t.User!).HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        e.HasOne(x => x.Wallet).WithOne(w => w.User!).HasForeignKey<Wallet>(w => w.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class VehicleConfig : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.RegistrationNumber).HasMaxLength(20).IsRequired();
        e.Property(x => x.Length).HasPrecision(5, 2);
        e.Property(x => x.Width).HasPrecision(5, 2);
        e.Property(x => x.Height).HasPrecision(5, 2);
        e.HasIndex(x => new { x.UserId, x.RegistrationNumber }).IsUnique();
    }
}

public class RefreshTokenConfig : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Token).HasMaxLength(200).IsRequired();
        e.HasIndex(x => x.Token).IsUnique();
        e.Ignore(x => x.IsActive);
    }
}

public class WalletConfig : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Balance).HasPrecision(10, 2);
    }
}

public class OtpChallengeConfig : IEntityTypeConfiguration<OtpChallenge>
{
    public void Configure(EntityTypeBuilder<OtpChallenge> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
        e.Property(x => x.Code).HasMaxLength(10).IsRequired();
        e.HasIndex(x => x.PhoneNumber);
    }
}

public class ParkingProviderConfig : IEntityTypeConfiguration<ParkingProvider>
{
    public void Configure(EntityTypeBuilder<ParkingProvider> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.BusinessName).HasMaxLength(200);
        e.HasMany(x => x.Facilities).WithOne(f => f.Provider!).HasForeignKey(f => f.ProviderId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ParkingFacilityConfig : IEntityTypeConfiguration<ParkingFacility>
{
    public void Configure(EntityTypeBuilder<ParkingFacility> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Name).HasMaxLength(200).IsRequired();
        e.Property(x => x.HealthScore).HasPrecision(5, 2);
        e.HasIndex(x => new { x.Latitude, x.Longitude }); // bounding-box search support
        e.HasMany(x => x.Spaces).WithOne(s => s.Facility!).HasForeignKey(s => s.FacilityId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class ParkingSpaceConfig : IEntityTypeConfiguration<ParkingSpace>
{
    public void Configure(EntityTypeBuilder<ParkingSpace> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Level).HasMaxLength(20);
        e.Property(x => x.SlotLabel).HasMaxLength(20);
        e.Property(x => x.MaxHeight).HasPrecision(5, 2);
        e.Property(x => x.MaxLength).HasPrecision(5, 2);
        e.Property(x => x.MaxWidth).HasPrecision(5, 2);
        e.HasMany(x => x.Amenities).WithOne(a => a.Space!).HasForeignKey(a => a.SpaceId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.AvailabilityWindows).WithOne(a => a.Space!).HasForeignKey(a => a.SpaceId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.PricingRules).WithOne(p => p.Space!).HasForeignKey(p => p.SpaceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class PricingRuleConfig : IEntityTypeConfiguration<PricingRule>
{
    public void Configure(EntityTypeBuilder<PricingRule> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.BasePrice).HasPrecision(10, 2);
        e.Property(x => x.SuggestedPrice).HasPrecision(10, 2);
        e.Property(x => x.TimeBand).HasMaxLength(50);
    }
}

public class BookingConfig : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Amount).HasPrecision(10, 2);
        e.Property(x => x.GuestName).HasMaxLength(150);
        e.Property(x => x.QrToken).HasMaxLength(64);
        e.HasOne(x => x.DriverUser).WithMany().HasForeignKey(x => x.DriverUserId).OnDelete(DeleteBehavior.Restrict);
        e.HasOne(x => x.Space).WithMany(s => s.Bookings).HasForeignKey(x => x.SpaceId).OnDelete(DeleteBehavior.Restrict);
        e.HasOne(x => x.Vehicle).WithMany().HasForeignKey(x => x.VehicleId).OnDelete(DeleteBehavior.Restrict);
        e.HasOne(x => x.Payment).WithOne(p => p.Booking!).HasForeignKey<Payment>(p => p.BookingId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.CheckLogs).WithOne(c => c.Booking!).HasForeignKey(c => c.BookingId).OnDelete(DeleteBehavior.Cascade);
        // Overlap/availability check and no-show job support.
        e.HasIndex(x => new { x.SpaceId, x.StartTime, x.EndTime, x.Status });
        e.HasIndex(x => new { x.Status, x.GraceExpiresAt });
    }
}

public class PaymentConfig : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Amount).HasPrecision(10, 2);
        e.Property(x => x.CommissionAmount).HasPrecision(10, 2);
        e.Property(x => x.DepositAmount).HasPrecision(10, 2);
        e.Property(x => x.GatewayReference).HasMaxLength(100);
        e.HasMany(x => x.Payouts).WithOne(p => p.Payment!).HasForeignKey(p => p.PaymentId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class PayoutConfig : IEntityTypeConfiguration<Payout>
{
    public void Configure(EntityTypeBuilder<Payout> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Amount).HasPrecision(10, 2);
    }
}

public class SubscriptionPlanConfig : IEntityTypeConfiguration<SubscriptionPlan>
{
    public void Configure(EntityTypeBuilder<SubscriptionPlan> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Price).HasPrecision(10, 2);
    }
}

public class ServiceBookingPlaceholderConfig : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> e)
    {
        e.HasKey(x => x.Id);
        e.Property(x => x.Title).HasMaxLength(200);
        e.HasIndex(x => new { x.UserId, x.ReadAt });
    }
}

using Microsoft.EntityFrameworkCore;
using ParkIt.Domain.Entities;

namespace ParkIt.Application.Abstractions;

/// <summary>
/// Abstraction over the EF Core context so the Application layer stays free of a concrete
/// database implementation. Infrastructure provides the implementation.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Vehicle> Vehicles { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Wallet> Wallets { get; }
    DbSet<OtpChallenge> OtpChallenges { get; }
    DbSet<ParkingProvider> ParkingProviders { get; }
    DbSet<ParkingFacility> ParkingFacilities { get; }
    DbSet<ParkingSpace> ParkingSpaces { get; }
    DbSet<SpaceAmenity> SpaceAmenities { get; }
    DbSet<SpaceAvailability> SpaceAvailabilities { get; }
    DbSet<PricingRule> PricingRules { get; }
    DbSet<FacilityPhoto> FacilityPhotos { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Payment> Payments { get; }
    DbSet<Payout> Payouts { get; }
    DbSet<CheckInCheckOutLog> CheckInCheckOutLogs { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Dispute> Disputes { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<SubscriptionPlan> SubscriptionPlans { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

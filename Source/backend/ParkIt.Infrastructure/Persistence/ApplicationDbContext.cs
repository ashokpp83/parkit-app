using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Domain.Common;
using ParkIt.Domain.Entities;

namespace ParkIt.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<ParkingProvider> ParkingProviders => Set<ParkingProvider>();
    public DbSet<ParkingFacility> ParkingFacilities => Set<ParkingFacility>();
    public DbSet<ParkingSpace> ParkingSpaces => Set<ParkingSpace>();
    public DbSet<SpaceAmenity> SpaceAmenities => Set<SpaceAmenity>();
    public DbSet<SpaceAvailability> SpaceAvailabilities => Set<SpaceAvailability>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();
    public DbSet<FacilityPhoto> FacilityPhotos => Set<FacilityPhoto>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Payout> Payouts => Set<Payout>();
    public DbSet<CheckInCheckOutLog> CheckInCheckOutLogs => Set<CheckInCheckOutLog>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        // Enums persist as their underlying int (EF default) so ordinal comparisons translate to SQL.
    }

    public override int SaveChanges()
    {
        Touch();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        Touch();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void Touch()
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}

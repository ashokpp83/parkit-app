using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;
using ParkIt.Domain.Enums;
using ParkIt.Infrastructure.Auth;
using ParkIt.Infrastructure.Persistence;
using Xunit;

namespace ParkIt.Tests;

public class PostgresPersistenceTests
{
    [Fact]
    [Trait("Category", "Postgres")]
    public async Task RegistrationAndVehicleSurviveNewDatabaseContexts()
    {
        var connectionString = Environment.GetEnvironmentVariable("PARKIT_TEST_DATABASE")
            ?? throw new InvalidOperationException("Set PARKIT_TEST_DATABASE to a dedicated disposable PostgreSQL test database.");
        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(connectionString).Options;
        var unique = Guid.NewGuid().ToString("N");
        var email = $"{unique}@example.test";
        var phone = unique[..20];
        Guid userId;
        Guid vehicleId;

        await using (var db = new ApplicationDbContext(options))
        {
            await db.Database.MigrateAsync();
            var auth = new AuthService(db, new TokenService(Options.Create(new JwtSettings())), new PasswordHasher(), new NoEmail());
            var registered = await auth.RegisterAsync(new RegisterRequest("Test Driver", email, phone, "Password1!", UserRole.Driver));
            userId = registered.User.Id;
            var vehicle = await new VehicleService(db).AddAsync(userId, new UpsertVehicleRequest("TN 01 TEST", VehicleType.Sedan, null, null, null));
            vehicleId = vehicle.Id;
        }

        await using (var db = new ApplicationDbContext(options))
        {
            var user = await db.Users.SingleAsync(u => u.Id == userId);
            Assert.Equal(email, user.Email);
            Assert.Equal(phone, user.PhoneNumber);
            Assert.True(new PasswordHasher().Verify("Password1!", user.PasswordHash));
            var vehicles = await new VehicleService(db).ListAsync(userId);
            Assert.Contains(vehicles, v => v.Id == vehicleId && v.RegistrationNumber == "TN 01 TEST");
        }
    }

    private sealed class NoEmail : IPasswordResetEmailSender
    {
        public void EnsureConfigured() => throw new InvalidOperationException("Email is not used by this test.");
        public Task SendAsync(string email, string token, CancellationToken ct) =>
            throw new InvalidOperationException("Email is not used by this test.");
    }
}

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;
using ParkIt.Domain.Enums;
using ParkIt.Infrastructure.Auth;
using ParkIt.Infrastructure.Persistence;
using Xunit;

namespace ParkIt.Tests;

public class AccountTests
{
    [Fact]
    public async Task RegistrationAndVehicleArePersistedForTheDriver()
    {
        await using var db = CreateDb();
        var sender = new TestEmailSender();
        var auth = CreateAuth(db, sender);
        var account = await auth.RegisterAsync(new RegisterRequest("Test Driver", "DRIVER@example.com", " 12345 ", "Password1!", UserRole.Driver));

        Assert.Equal("driver@example.com", account.User.Email);
        Assert.Equal("12345", account.User.PhoneNumber);
        Assert.NotEqual("Password1!", (await db.Users.SingleAsync()).PasswordHash);
        var vehicles = new VehicleService(db);
        var created = await vehicles.AddAsync(account.User.Id, new UpsertVehicleRequest(" tn 01 1234 ", VehicleType.Sedan, null, null, null));
        Assert.Equal("TN 01 1234", created.RegistrationNumber);
        Assert.Contains(await vehicles.ListAsync(account.User.Id), v => v.Id == created.Id);
        Assert.Empty(await vehicles.ListAsync(Guid.NewGuid()));
        await Assert.ThrowsAsync<AppException>(() => auth.RegisterAsync(new RegisterRequest("Other", "other@example.com", "12345", "Password1!")));
    }

    [Fact]
    public async Task ResetTokenExpiresIsSingleUseAndRevokesRefreshTokens()
    {
        await using var db = CreateDb();
        var sender = new TestEmailSender();
        var auth = CreateAuth(db, sender);
        var account = await auth.RegisterAsync(new RegisterRequest("Test Driver", "driver@example.com", "12345", "Password1!"));
        await auth.ForgotPasswordAsync(new ForgotPasswordRequest("DRIVER@example.com"));
        var firstToken = Assert.IsType<string>(sender.Token);
        Assert.NotEqual(firstToken, (await db.PasswordResetTokens.SingleAsync()).TokenHash);
        await auth.ForgotPasswordAsync(new ForgotPasswordRequest("driver@example.com"));
        var secondToken = Assert.IsType<string>(sender.Token);

        await auth.ResetPasswordAsync(new ResetPasswordRequest(secondToken, "NewPassword1!"));
        await Assert.ThrowsAsync<AppException>(() => auth.ResetPasswordAsync(new ResetPasswordRequest(secondToken, "AnotherPassword1!")));
        await Assert.ThrowsAsync<AppException>(() => auth.ResetPasswordAsync(new ResetPasswordRequest(firstToken, "AnotherPassword1!")));
        await Assert.ThrowsAsync<AppException>(() => auth.RefreshAsync(new RefreshRequest(account.RefreshToken)));
        await Assert.ThrowsAsync<AppException>(() => auth.LoginAsync(new LoginRequest("driver@example.com", "Password1!")));
        Assert.NotNull(await auth.LoginAsync(new LoginRequest("driver@example.com", "NewPassword1!")));

        await auth.ForgotPasswordAsync(new ForgotPasswordRequest("driver@example.com"));
        var expiredToken = Assert.IsType<string>(sender.Token);
        var record = await db.PasswordResetTokens.OrderByDescending(t => t.CreatedAt).FirstAsync();
        record.ExpiresAt = DateTime.UtcNow.AddSeconds(-1);
        await db.SaveChangesAsync();
        await Assert.ThrowsAsync<AppException>(() => auth.ResetPasswordAsync(new ResetPasswordRequest(expiredToken, "NewPassword2!")));
    }

    [Fact]
    public async Task UnknownEmailDoesNotSendAResetLink()
    {
        await using var db = CreateDb();
        var sender = new TestEmailSender();
        await CreateAuth(db, sender).ForgotPasswordAsync(new ForgotPasswordRequest("unknown@example.com"));
        Assert.Null(sender.Token);
        Assert.Empty(db.PasswordResetTokens);
    }

    private static ApplicationDbContext CreateDb() =>
        new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private static AuthService CreateAuth(ApplicationDbContext db, TestEmailSender sender) =>
        new(db, new TokenService(Options.Create(new JwtSettings())), new PasswordHasher(), sender);

    private sealed class TestEmailSender : IPasswordResetEmailSender
    {
        public string? Token { get; private set; }
        public void EnsureConfigured() { }
        public Task SendAsync(string email, string token, CancellationToken ct)
        {
            Token = token;
            return Task.CompletedTask;
        }
    }
}

using ParkIt.Application.Abstractions;
using ParkIt.Domain.Entities;
using IdentityHasher = Microsoft.AspNetCore.Identity.PasswordHasher<ParkIt.Domain.Entities.User>;

namespace ParkIt.Infrastructure.Auth;

/// <summary>Wraps ASP.NET Core Identity's PBKDF2 password hasher.</summary>
public class PasswordHasher : IPasswordHasher
{
    private readonly IdentityHasher _inner = new();
    private static readonly User Dummy = new();

    public string Hash(string password) => _inner.HashPassword(Dummy, password);

    public bool Verify(string password, string hash) =>
        _inner.VerifyHashedPassword(Dummy, hash, password)
            != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed;
}

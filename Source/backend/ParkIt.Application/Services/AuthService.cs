using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;

namespace ParkIt.Application.Services;

public class AuthService
{
    private readonly IApplicationDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IPasswordHasher _hasher;

    public AuthService(IApplicationDbContext db, ITokenService tokens, IPasswordHasher hasher)
    {
        _db = db;
        _tokens = tokens;
        _hasher = hasher;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email || u.PhoneNumber == req.PhoneNumber, ct))
            throw AppException.Conflict("A user with this email or phone already exists.");

        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = email,
            PhoneNumber = req.PhoneNumber.Trim(),
            PasswordHash = _hasher.Hash(req.Password),
            Role = req.Role,
            PreferredLanguage = req.PreferredLanguage,
            Wallet = new Wallet()
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var key = req.EmailOrPhone.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.Email == key || u.PhoneNumber == req.EmailOrPhone.Trim(), ct);
        if (user is null || !_hasher.Verify(req.Password, user.PasswordHash))
            throw AppException.Unauthorized("Invalid credentials.");
        return await IssueTokensAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest req, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == req.RefreshToken, ct);
        if (token is null || !token.IsActive || token.User is null)
            throw AppException.Unauthorized("Invalid or expired refresh token.");

        token.RevokedAt = DateTime.UtcNow;
        var response = await IssueTokensAsync(token.User, ct);
        return response;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == refreshToken, ct);
        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<string> SendOtpAsync(OtpSendRequest req, CancellationToken ct = default)
    {
        // MVP: generate a deterministic-length code. A real SMS gateway is wired in Infrastructure later.
        var code = (100000 + (Math.Abs(req.PhoneNumber.GetHashCode()) % 900000)).ToString();
        _db.OtpChallenges.Add(new OtpChallenge
        {
            PhoneNumber = req.PhoneNumber.Trim(),
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(5)
        });
        await _db.SaveChangesAsync(ct);
        return code; // returned only in dev; production sends via SMS and returns nothing
    }

    public async Task VerifyOtpAsync(OtpVerifyRequest req, CancellationToken ct = default)
    {
        var challenge = await _db.OtpChallenges
            .Where(o => o.PhoneNumber == req.PhoneNumber.Trim() && !o.Consumed)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);
        if (challenge is null || challenge.ExpiresAt < DateTime.UtcNow || challenge.Code != req.Code)
            throw AppException.Conflict("Invalid or expired OTP.");

        challenge.Consumed = true;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.PhoneNumber == req.PhoneNumber.Trim(), ct);
        if (user is not null) user.PhoneVerified = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<UserDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw AppException.NotFound("User");
        return ToDto(user);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var pair = _tokens.CreateTokens(user);
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = pair.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        await _db.SaveChangesAsync(ct);
        return new AuthResponse(pair.AccessToken, pair.RefreshToken, pair.AccessTokenExpiresAt, ToDto(user));
    }

    public static UserDto ToDto(User u) => new(
        u.Id, u.FullName, u.Email, u.PhoneNumber, u.Role, u.KycStatus,
        u.PhoneVerified, u.ReliabilityScore, u.PreferredLanguage);
}

using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record RegisterRequest(
    [Required, MaxLength(150)] string FullName,
    [Required, EmailAddress, MaxLength(255)] string Email,
    [Required, MaxLength(20)] string PhoneNumber,
    [Required, MinLength(6)] string Password,
    UserRole Role = UserRole.Driver,
    string PreferredLanguage = "en");

public record LoginRequest([Required] string EmailOrPhone, [Required] string Password);
public record OtpLoginRequest([Required] string PhoneNumber, [Required] string Code);
public record RefreshRequest([Required] string RefreshToken);
public record OtpSendRequest([Required] string PhoneNumber);
public record OtpVerifyRequest([Required] string PhoneNumber, [Required] string Code);
public record ForgotPasswordRequest([Required, EmailAddress] string Email);
public record ResetPasswordRequest([Required, StringLength(64, MinimumLength = 64)] string Token, [Required, MinLength(6)] string Password);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    UserDto User);

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    UserRole Role,
    KycStatus KycStatus,
    bool PhoneVerified,
    decimal ReliabilityScore,
    string PreferredLanguage);

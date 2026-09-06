using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record RegisterRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    [Required] string PhoneNumber,
    [Required, MinLength(6)] string Password,
    UserRole Role = UserRole.Driver,
    string PreferredLanguage = "en");

public record LoginRequest([Required] string EmailOrPhone, [Required] string Password);
public record RefreshRequest([Required] string RefreshToken);
public record OtpSendRequest([Required] string PhoneNumber);
public record OtpVerifyRequest([Required] string PhoneNumber, [Required] string Code);

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

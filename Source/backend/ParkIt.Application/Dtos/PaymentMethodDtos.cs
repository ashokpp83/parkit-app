using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record SavedPaymentMethodDto(
    Guid Id,
    PaymentMethod Method,
    string? Brand,
    string? Last4,
    byte? ExpiryMonth,
    short? ExpiryYear,
    bool IsDefault);

public record AddPaymentMethodRequest(
    [Required] PaymentMethod Method,
    string? Brand,
    string? Last4,
    byte? ExpiryMonth,
    short? ExpiryYear,
    string? GatewayToken,
    bool IsDefault = false);

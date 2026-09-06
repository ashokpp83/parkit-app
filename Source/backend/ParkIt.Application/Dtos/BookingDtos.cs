using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record CreateBookingRequest(
    [Required] Guid SpaceId,
    [Required] Guid VehicleId,
    [Required] DateTime StartTime,
    [Required] DateTime EndTime,
    string? GuestName);

public record PayBookingRequest(
    [Required] PaymentMethod Method);

public record BookingDto(
    Guid Id,
    Guid SpaceId,
    string FacilityName,
    string? SlotLabel,
    Guid VehicleId,
    string VehicleRegistration,
    DateTime StartTime,
    DateTime EndTime,
    BookingStatus Status,
    bool IsGuaranteed,
    decimal Amount,
    DateTime? GraceExpiresAt,
    string? QrToken,
    string? DriverName,
    string? DriverEmail,
    string? DriverPhoneNumber,
    string? OwnerName,
    string? OwnerEmail,
    string? OwnerPhoneNumber,
    PaymentStatus? PaymentStatus,
    PaymentMethod? PaymentMethod,
    string? PaymentReference);


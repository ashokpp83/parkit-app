using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record ServiceBookingDto(
    Guid Id,
    Guid FacilityId,
    string FacilityName,
    ValueAddedServiceType ServiceType,
    decimal Amount,
    ServiceBookingStatus Status,
    DateTime CreatedAt);

public record OwnerServiceBookingDto(
    Guid Id,
    ValueAddedServiceType ServiceType,
    decimal Amount,
    ServiceBookingStatus Status,
    DateTime CreatedAt,
    string CustomerName,
    string CustomerEmail);

public record CreateServiceBookingRequest(
    [Required] Guid FacilityId,
    [Required] ValueAddedServiceType ServiceType);

using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record ParkingSearchQuery
{
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public double RadiusKm { get; init; } = 3;
    public decimal? MaxPrice { get; init; }
    public VehicleType? VehicleType { get; init; }
    public CostType? CostType { get; init; }
    public bool? Covered { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}

public record SpaceSearchResult(
    Guid SpaceId,
    Guid FacilityId,
    string FacilityName,
    string AddressText,
    double Latitude,
    double Longitude,
    double DistanceKm,
    string? Level,
    string? SlotLabel,
    CostType CostType,
    decimal? HourlyPrice,
    SpaceStatus Status,
    short SecurityLevel,
    VerificationStatus VerificationStatus,
    IReadOnlyList<AmenityType> Amenities,
    int FacilityAvailableSlots,
    int FacilityTotalSlots);

public record SpaceDetailDto(
    Guid Id,
    Guid FacilityId,
    string FacilityName,
    string AddressText,
    string? AccessInstructions,
    double Latitude,
    double Longitude,
    string? Level,
    string? SlotLabel,
    Ownership Ownership,
    CostType CostType,
    AccessType AccessType,
    CoveredType CoveredType,
    VehicleType MaxVehicleType,
    short SecurityLevel,
    VerificationStatus VerificationStatus,
    SpaceStatus Status,
    IReadOnlyList<AmenityType> Amenities,
    IReadOnlyList<PricingRuleDto> Pricing);

public record FacilityCreateRequest(
    string Name,
    string AddressText,
    double Latitude,
    double Longitude,
    string? AccessInstructions,
    string? BusinessName,
    string? Level,
    string? SlotLabel,
    VehicleType MaxVehicleType,
    int TotalSlots,
    int AvailableSlots,
    CostType CostType,
    decimal? HourlyPrice,
    short SecurityLevel,
    bool Covered,
    bool Gated,
    bool Cctv,
    bool EvCharging,
    bool Lift,
    bool HandicappedAccess,
    bool Guard,
    bool WellLit,
    bool TwoWheeler,
    bool Is24x7 = true);

public record FacilitySummaryDto(
    Guid Id,
    string Name,
    string AddressText,
    double Latitude,
    double Longitude,
    string? AccessInstructions,
    string? Level,
    string? SlotLabel,
    CostType CostType,
    decimal? HourlyPrice,
    short SecurityLevel,
    bool Covered,
    bool Gated,
    bool Cctv,
    bool EvCharging,
    bool Lift,
    bool HandicappedAccess,
    bool Guard,
    bool WellLit,
    bool TwoWheeler,
    bool Is24x7,
    bool IsApproved,
    int AvailableSlots,
    int TotalSlots,
    VehicleType MaxVehicleType);

public record FacilitySpaceDto(
    Guid SpaceId,
    string? Level,
    string? SlotLabel,
    VehicleType MaxVehicleType,
    CostType CostType,
    decimal? HourlyPrice,
    SpaceStatus Status,
    IReadOnlyList<AmenityType> Amenities,
    IReadOnlyList<PricingRuleDto> Pricing);

public record FacilityDetailDto(
    Guid Id,
    string Name,
    string AddressText,
    double Latitude,
    double Longitude,
    string? AccessInstructions,
    string? OwnerName,
    string? OwnerEmail,
    string? OwnerPhoneNumber,
    bool IsApproved,
    int AvailableSlots,
    int TotalSlots,
    IReadOnlyList<FacilitySpaceDto> Spaces,
    IReadOnlyList<FacilityPhotoDto> Photos);

public record FacilityPhotoDto(
    Guid Id,
    Guid FacilityId,
    string FileName,
    string BlobUrl,
    int DisplayOrder);

public record UploadPhotoRequest(
    string FileName,
    string Base64Data);

public record SpaceAvailabilityDto(
    Guid SpaceId,
    SpaceStatus Status,
    IReadOnlyList<SpaceAvailabilityWindowDto> Windows);

public record SpaceAvailabilityWindowDto(
    short? DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsRecurring);

public record PricingRuleDto(PricingUnit Unit, decimal BasePrice, decimal? SuggestedPrice);

// Dashboard Statistics DTOs
public record RevenueByCustomerDto(
    string CustomerName,
    string CustomerEmail,
    int BookingCount,
    decimal TotalRevenue,
    DateTime LastBookingDate);

public record RevenueByFacilityDto(
    Guid FacilityId,
    string FacilityName,
    int BookingCount,
    decimal TotalRevenue,
    decimal AverageRevenuePerBooking);

public record OccupancyByHourDto(
    int Hour,
    int TotalSlots,
    int OccupiedSlots,
    decimal OccupancyPercentage);

public record CustomerStickinessDto(
    string CustomerName,
    string CustomerEmail,
    int TotalBookings,
    int UniqueFacilities,
    DateTime FirstBookingDate,
    DateTime LastBookingDate,
    int DaysSinceLastBooking,
    decimal StickinessScore);

public record OwnerDashboardStatisticsDto(
    decimal TotalRevenue,
    int TotalBookings,
    decimal AverageRevenuePerBooking,
    IReadOnlyList<RevenueByCustomerDto> TopCustomers,
    IReadOnlyList<RevenueByFacilityDto> RevenueByFacility,
    IReadOnlyList<OccupancyByHourDto> OccupancyByHour,
    IReadOnlyList<CustomerStickinessDto> CustomerStickiness);

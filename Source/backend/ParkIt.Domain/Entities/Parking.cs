using ParkIt.Domain.Common;
using ParkIt.Domain.Enums;

namespace ParkIt.Domain.Entities;

public class ParkingProvider : BaseEntity
{
    public Guid OwnerUserId { get; set; }
    public User? OwnerUser { get; set; }
    public ProviderType ProviderType { get; set; } = ProviderType.Individual;
    public string BusinessName { get; set; } = string.Empty;
    public KycStatus KycStatus { get; set; } = KycStatus.Unverified;
    public RevenueModel RevenueModel { get; set; } = RevenueModel.Commission;

    public ICollection<ParkingFacility> Facilities { get; set; } = new List<ParkingFacility>();
}

/// <summary>
/// A physical location containing many spaces across levels/zones.
/// Location stored as lat/lng; production target is PostGIS geography(Point).
/// </summary>
public class ParkingFacility : BaseEntity
{
    public Guid ProviderId { get; set; }
    public ParkingProvider? Provider { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AddressText { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double? EntranceLatitude { get; set; }
    public double? EntranceLongitude { get; set; }
    public string? AccessInstructions { get; set; }
    public decimal HealthScore { get; set; } = 100m;
    public bool IsApproved { get; set; }

    public ICollection<ParkingSpace> Spaces { get; set; } = new List<ParkingSpace>();
    public ICollection<FacilityPhoto> Photos { get; set; } = new List<FacilityPhoto>();
}

/// <summary>The core inventory unit. All discovery/booking is modeled around a Space, not a "lot".</summary>
public class ParkingSpace : BaseEntity
{
    public Guid FacilityId { get; set; }
    public ParkingFacility? Facility { get; set; }
    public string? Level { get; set; }
    public string? SlotLabel { get; set; }
    public Ownership Ownership { get; set; } = Ownership.Private;
    public CostType CostType { get; set; } = CostType.Paid;
    public AccessType AccessType { get; set; } = AccessType.Reserved;
    public CoveredType CoveredType { get; set; } = CoveredType.Uncovered;
    public VehicleType MaxVehicleType { get; set; } = VehicleType.SUV;
    public decimal? MaxHeight { get; set; }
    public decimal? MaxLength { get; set; }
    public decimal? MaxWidth { get; set; }
    public short SecurityLevel { get; set; } = 3; // 1-5
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Unverified;
    public SpaceStatus CurrentStatus { get; set; } = SpaceStatus.LikelyAvailable;
    public bool SensorEnabled { get; set; }
    public bool AnprEnabled { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<SpaceAmenity> Amenities { get; set; } = new List<SpaceAmenity>();
    public ICollection<SpaceAvailability> AvailabilityWindows { get; set; } = new List<SpaceAvailability>();
    public ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

public class SpaceAmenity : BaseEntity
{
    public Guid SpaceId { get; set; }
    public ParkingSpace? Space { get; set; }
    public AmenityType Amenity { get; set; }
}

public class SpaceAvailability : BaseEntity
{
    public Guid SpaceId { get; set; }
    public ParkingSpace? Space { get; set; }
    public short? DayOfWeek { get; set; } // 0-6, null = all days
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsRecurring { get; set; } = true;
}

public class PricingRule : BaseEntity
{
    public Guid SpaceId { get; set; }
    public ParkingSpace? Space { get; set; }
    public PricingUnit Unit { get; set; } = PricingUnit.Hour;
    public decimal BasePrice { get; set; }
    public short? DayOfWeek { get; set; }
    public string? TimeBand { get; set; }
    public decimal? SuggestedPrice { get; set; }
}

public class VerificationRecord : BaseEntity
{
    public SubjectType SubjectType { get; set; }
    public Guid SubjectId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string BlobUrl { get; set; } = string.Empty;
    public VerificationRecordStatus Status { get; set; } = VerificationRecordStatus.Pending;
}

public class FacilityPhoto : BaseEntity
{
    public Guid FacilityId { get; set; }
    public ParkingFacility? Facility { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

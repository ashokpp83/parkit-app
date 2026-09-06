using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Services;

public class ParkingService
{
    private readonly IApplicationDbContext _db;
    public ParkingService(IApplicationDbContext db) => _db = db;

    /// <summary>
    /// Radius search around a point. A bounding box narrows rows in SQL, then exact
    /// haversine distance is computed in memory. Production target replaces this with a
    /// PostGIS ST_DWithin spatial query.
    /// </summary>
    public async Task<PagedResult<SpaceSearchResult>> SearchAsync(ParkingSearchQuery q, CancellationToken ct = default)
    {
        // ~111 km per degree latitude; widen longitude by latitude for the box.
        double latDelta = q.RadiusKm / 111.0;
        double lonDelta = q.RadiusKm / (111.0 * Math.Max(0.01, Math.Cos(q.Latitude * Math.PI / 180.0)));
        double minLat = q.Latitude - latDelta, maxLat = q.Latitude + latDelta;
        double minLon = q.Longitude - lonDelta, maxLon = q.Longitude + lonDelta;

        var query = _db.ParkingSpaces
            .Where(s => s.IsActive && s.Facility!.IsApproved
                && s.Facility.Latitude >= minLat && s.Facility.Latitude <= maxLat
                && s.Facility.Longitude >= minLon && s.Facility.Longitude <= maxLon);

        if (q.MaxPrice is not null)
            query = query.Where(s => s.PricingRules.Any(p => p.Unit == PricingUnit.Hour && p.BasePrice <= q.MaxPrice));
        if (q.CostType is not null)
            query = query.Where(s => s.CostType == q.CostType);
        if (q.Covered == true)
            query = query.Where(s => s.CoveredType == CoveredType.Covered);
        if (q.VehicleType is not null)
            query = query.Where(s => (int)s.MaxVehicleType >= (int)q.VehicleType);

        var candidates = await query
            .Select(s => new
            {
                s.Id,
                s.FacilityId,
                FacilityName = s.Facility!.Name,
                s.Facility.AddressText,
                s.Facility.Latitude,
                s.Facility.Longitude,
                s.Level,
                s.SlotLabel,
                s.CostType,
                s.CurrentStatus,
                s.SecurityLevel,
                s.VerificationStatus,
                HourlyPrice = s.PricingRules.Where(p => p.Unit == PricingUnit.Hour)
                    .Select(p => (decimal?)p.BasePrice).FirstOrDefault(),
                Amenities = s.Amenities.Select(a => a.Amenity).ToList()
            })
            .ToListAsync(ct);

        var facilityCounts = candidates
            .GroupBy(x => x.FacilityId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Count(),
                    Available = g.Count(x => x.CurrentStatus != SpaceStatus.Full)
                });

        var ranked = candidates
            .Select(s => new
            {
                s,
                Distance = GeoUtil.HaversineKm(q.Latitude, q.Longitude, s.Latitude, s.Longitude)
            })
            .Where(x => x.Distance <= q.RadiusKm)
            .Where(x => x.s.CurrentStatus != SpaceStatus.Full)
            .OrderBy(x => x.Distance)
            .ToList();

        var items = ranked
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(x => new SpaceSearchResult(
                x.s.Id, x.s.FacilityId, x.s.FacilityName, x.s.AddressText,
                x.s.Latitude, x.s.Longitude, Math.Round(x.Distance, 3),
                x.s.Level, x.s.SlotLabel, x.s.CostType, x.s.HourlyPrice,
                x.s.CurrentStatus, x.s.SecurityLevel, x.s.VerificationStatus, x.s.Amenities,
                facilityCounts[x.s.FacilityId].Available, facilityCounts[x.s.FacilityId].Total))
            .ToList();

        return new PagedResult<SpaceSearchResult>
        {
            Items = items,
            TotalCount = ranked.Count,
            Page = q.Page,
            PageSize = q.PageSize
        };
    }

    public async Task<SpaceDetailDto> GetSpaceAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _db.ParkingSpaces
            .Include(x => x.Facility)
            .Include(x => x.Amenities)
            .Include(x => x.PricingRules)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw AppException.NotFound("Parking space");

        return new SpaceDetailDto(
            s.Id, s.FacilityId, s.Facility!.Name, s.Facility.AddressText, s.Facility.AccessInstructions,
            s.Facility.Latitude, s.Facility.Longitude, s.Level, s.SlotLabel,
            s.Ownership, s.CostType, s.AccessType, s.CoveredType, s.MaxVehicleType,
            s.SecurityLevel, s.VerificationStatus, s.CurrentStatus,
            s.Amenities.Select(a => a.Amenity).ToList(),
            s.PricingRules.Select(p => new PricingRuleDto(p.Unit, p.BasePrice, p.SuggestedPrice)).ToList());
    }

    public async Task<FacilitySummaryDto> CreateFacilityAsync(FacilityCreateRequest req, Guid ownerUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) throw AppException.BadRequest("Facility name is required.");
        if (string.IsNullOrWhiteSpace(req.AddressText)) throw AppException.BadRequest("Facility address is required.");
        if (req.Latitude is 0 && req.Longitude is 0) throw AppException.BadRequest("A valid latitude and longitude are required.");
        if (req.TotalSlots < 1) throw AppException.BadRequest("Total slots must be at least 1.");
        if (req.AvailableSlots < 0 || req.AvailableSlots > req.TotalSlots) throw AppException.BadRequest("Available slots must be between 0 and total slots.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == ownerUserId, ct)
            ?? throw AppException.NotFound("User");
        if (user.Role != UserRole.Owner)
            throw AppException.Forbidden("Only facility owners can create parking facilities.");

        var provider = await _db.ParkingProviders.FirstOrDefaultAsync(p => p.OwnerUserId == ownerUserId, ct);
        if (provider is null)
        {
            provider = new ParkingProvider
            {
                OwnerUserId = ownerUserId,
                ProviderType = ProviderType.Individual,
                BusinessName = string.IsNullOrWhiteSpace(req.BusinessName) ? req.Name : req.BusinessName,
                KycStatus = KycStatus.Verified,
                RevenueModel = RevenueModel.Commission
            };
            _db.ParkingProviders.Add(provider);
            await _db.SaveChangesAsync(ct);
        }

        var facility = new ParkingFacility
        {
            ProviderId = provider.Id,
            Name = req.Name.Trim(),
            AddressText = req.AddressText.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            AccessInstructions = req.AccessInstructions,
            IsApproved = true,
            HealthScore = 90m
        };
        _db.ParkingFacilities.Add(facility);
        await _db.SaveChangesAsync(ct);

        var spaces = new List<ParkingSpace>();
        for (var i = 1; i <= req.TotalSlots; i++)
        {
            var space = new ParkingSpace
            {
                FacilityId = facility.Id,
                Level = string.IsNullOrWhiteSpace(req.Level) ? "Ground" : req.Level.Trim(),
                SlotLabel = string.IsNullOrWhiteSpace(req.SlotLabel) ? $"A-{i}" : $"{req.SlotLabel.Trim()}-{i}",
                Ownership = Ownership.Private,
                CostType = req.CostType,
                AccessType = AccessType.Reserved,
                CoveredType = req.Covered ? CoveredType.Covered : CoveredType.Uncovered,
                SecurityLevel = req.SecurityLevel < 1 ? (short)3 : req.SecurityLevel,
                VerificationStatus = VerificationStatus.Verified,
                CurrentStatus = i <= req.AvailableSlots ? SpaceStatus.Guaranteed : SpaceStatus.Full,
                IsActive = true,
                MaxVehicleType = req.MaxVehicleType
            };

            if (req.Cctv) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.CCTV });
            if (req.Gated) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Gated });
            if (req.EvCharging) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.EVCharging });
            if (req.Lift) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Lift });
            if (req.HandicappedAccess) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.HandicappedAccess });
            if (req.Guard) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.Guard });
            if (req.WellLit) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.WellLit });
            if (req.TwoWheeler) space.Amenities.Add(new SpaceAmenity { Amenity = AmenityType.TwoWheeler });
            if (req.Is24x7) space.AvailabilityWindows.Add(new SpaceAvailability { StartTime = new TimeOnly(0, 0), EndTime = new TimeOnly(23, 59), IsRecurring = true });

            if (req.CostType == CostType.Paid && req.HourlyPrice is > 0)
            {
                space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Hour, BasePrice = req.HourlyPrice.Value, SuggestedPrice = req.HourlyPrice.Value });
                space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Day, BasePrice = Math.Round(req.HourlyPrice.Value * 8m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 8m, 2) });
                space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Week, BasePrice = Math.Round(req.HourlyPrice.Value * 40m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 40m, 2) });
                space.PricingRules.Add(new PricingRule { Unit = PricingUnit.Month, BasePrice = Math.Round(req.HourlyPrice.Value * 160m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 160m, 2) });
            }

            spaces.Add(space);
        }

        _db.ParkingSpaces.AddRange(spaces);
        await _db.SaveChangesAsync(ct);

        var availableCount = spaces.Count(s => s.CurrentStatus != SpaceStatus.Full);
        var firstSpace = spaces[0];
        return new FacilitySummaryDto(
            facility.Id,
            facility.Name,
            facility.AddressText,
            facility.Latitude,
            facility.Longitude,
            facility.AccessInstructions,
            firstSpace.Level,
            firstSpace.SlotLabel,
            firstSpace.CostType,
            req.HourlyPrice,
            firstSpace.SecurityLevel,
            req.Covered,
            req.Gated,
            req.Cctv,
            req.EvCharging,
            req.Lift,
            req.HandicappedAccess,
            req.Guard,
            req.WellLit,
            req.TwoWheeler,
            req.Is24x7,
            facility.IsApproved,
            availableCount,
            req.TotalSlots,
            req.MaxVehicleType);
    }

    public async Task<FacilitySummaryDto> UpdateFacilityAsync(Guid facilityId, FacilityCreateRequest req, Guid ownerUserId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) throw AppException.BadRequest("Facility name is required.");
        if (string.IsNullOrWhiteSpace(req.AddressText)) throw AppException.BadRequest("Facility address is required.");
        if (req.Latitude is 0 && req.Longitude is 0) throw AppException.BadRequest("A valid latitude and longitude are required.");
        if (req.TotalSlots < 1) throw AppException.BadRequest("Total slots must be at least 1.");
        if (req.AvailableSlots < 0 || req.AvailableSlots > req.TotalSlots) throw AppException.BadRequest("Available slots must be between 0 and total slots.");

        var facility = await _db.ParkingFacilities
            .Include(f => f.Provider)
            .Include(f => f.Spaces).ThenInclude(s => s.Amenities)
            .Include(f => f.Spaces).ThenInclude(s => s.PricingRules)
            .Include(f => f.Spaces).ThenInclude(s => s.AvailabilityWindows)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw AppException.NotFound("Parking facility");

        if (facility.Provider?.OwnerUserId != ownerUserId)
            throw AppException.Forbidden("Only the facility owner can edit this parking facility.");

        var spaces = facility.Spaces
            .OrderBy(s => s.CreatedAt)
            .ThenBy(s => s.SlotLabel)
            .ToList();

        if (req.TotalSlots < spaces.Count)
            throw AppException.BadRequest("Total slots cannot be reduced below existing slots.");

        while (spaces.Count < req.TotalSlots)
        {
            var newSpace = new ParkingSpace
            {
                FacilityId = facility.Id,
                Ownership = Ownership.Private,
                AccessType = AccessType.Reserved,
                VerificationStatus = VerificationStatus.Verified,
                IsActive = true
            };
            _db.ParkingSpaces.Add(newSpace);
            spaces.Add(newSpace);
        }

        facility.Name = req.Name.Trim();
        facility.AddressText = req.AddressText.Trim();
        facility.Latitude = req.Latitude;
        facility.Longitude = req.Longitude;
        facility.AccessInstructions = req.AccessInstructions;

        for (var i = 0; i < spaces.Count; i++)
        {
            var space = spaces[i];
            var isAvailable = i < req.AvailableSlots;

            space.Level = string.IsNullOrWhiteSpace(req.Level) ? "Ground" : req.Level.Trim();
            space.SlotLabel = string.IsNullOrWhiteSpace(req.SlotLabel) ? $"A-{i + 1}" : $"{req.SlotLabel.Trim()}-{i + 1}";
            space.CostType = req.CostType;
            space.AccessType = AccessType.Reserved;
            space.CoveredType = req.Covered ? CoveredType.Covered : CoveredType.Uncovered;
            space.SecurityLevel = req.SecurityLevel < 1 ? (short)3 : req.SecurityLevel;
            space.VerificationStatus = VerificationStatus.Verified;
            space.CurrentStatus = isAvailable ? SpaceStatus.Guaranteed : SpaceStatus.Full;
            space.IsActive = true;
            space.MaxVehicleType = req.MaxVehicleType;

            // Explicitly remove old child rows from the DbSets (rather than mutating the
            // tracked collection navigation in place with Clear()). Clearing a loaded
            // navigation and re-adding replacements in the same SaveChanges batch confuses
            // the provider's cascade-delete fixup and throws a DbUpdateConcurrencyException.
            _db.SpaceAmenities.RemoveRange(space.Amenities.ToList());
            _db.SpaceAvailabilities.RemoveRange(space.AvailabilityWindows.ToList());
            _db.PricingRules.RemoveRange(space.PricingRules.ToList());
        }

        // Persist all removals first, in their own batch, before adding replacements.
        await _db.SaveChangesAsync(ct);

        for (var i = 0; i < spaces.Count; i++)
        {
            var space = spaces[i];
            space.Amenities.Clear();
            space.AvailabilityWindows.Clear();
            space.PricingRules.Clear();

            // Add new child rows directly to their DbSets (rather than via the collection
            // navigation) so EF unambiguously tracks them as Added. These entities already
            // have a non-default client-generated Id (see BaseEntity), so when discovered
            // only through a navigation collection on an Unchanged parent, EF's change
            // detection cannot tell they are new and marks them Modified instead of Added,
            // which then fails at SaveChanges with a DbUpdateConcurrencyException.
            var newAmenities = new List<SpaceAmenity>();
            if (req.Cctv) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.CCTV });
            if (req.Gated) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.Gated });
            if (req.EvCharging) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.EVCharging });
            if (req.Lift) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.Lift });
            if (req.HandicappedAccess) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.HandicappedAccess });
            if (req.Guard) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.Guard });
            if (req.WellLit) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.WellLit });
            if (req.TwoWheeler) newAmenities.Add(new SpaceAmenity { SpaceId = space.Id, Amenity = AmenityType.TwoWheeler });
            if (newAmenities.Count > 0)
            {
                _db.SpaceAmenities.AddRange(newAmenities);
                foreach (var a in newAmenities) space.Amenities.Add(a);
            }

            if (req.Is24x7)
            {
                var window = new SpaceAvailability
                {
                    SpaceId = space.Id,
                    StartTime = new TimeOnly(0, 0),
                    EndTime = new TimeOnly(23, 59),
                    IsRecurring = true
                };
                _db.SpaceAvailabilities.Add(window);
                space.AvailabilityWindows.Add(window);
            }

            if (req.CostType == CostType.Paid && req.HourlyPrice is > 0)
            {
                var newPricingRules = new List<PricingRule>
                {
                    new() { SpaceId = space.Id, Unit = PricingUnit.Hour, BasePrice = req.HourlyPrice.Value, SuggestedPrice = req.HourlyPrice.Value },
                    new() { SpaceId = space.Id, Unit = PricingUnit.Day, BasePrice = Math.Round(req.HourlyPrice.Value * 8m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 8m, 2) },
                    new() { SpaceId = space.Id, Unit = PricingUnit.Week, BasePrice = Math.Round(req.HourlyPrice.Value * 40m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 40m, 2) },
                    new() { SpaceId = space.Id, Unit = PricingUnit.Month, BasePrice = Math.Round(req.HourlyPrice.Value * 160m, 2), SuggestedPrice = Math.Round(req.HourlyPrice.Value * 160m, 2) },
                };
                _db.PricingRules.AddRange(newPricingRules);
                foreach (var p in newPricingRules) space.PricingRules.Add(p);
            }
        }

        await _db.SaveChangesAsync(ct);

        var firstSpace = spaces.First();
        return new FacilitySummaryDto(
            facility.Id,
            facility.Name,
            facility.AddressText,
            facility.Latitude,
            facility.Longitude,
            facility.AccessInstructions,
            firstSpace.Level,
            firstSpace.SlotLabel,
            firstSpace.CostType,
            req.HourlyPrice,
            firstSpace.SecurityLevel,
            req.Covered,
            req.Gated,
            req.Cctv,
            req.EvCharging,
            req.Lift,
            req.HandicappedAccess,
            req.Guard,
            req.WellLit,
            req.TwoWheeler,
            req.Is24x7,
            facility.IsApproved,
            req.AvailableSlots,
            req.TotalSlots,
            req.MaxVehicleType);
    }

    public async Task<IReadOnlyList<FacilitySummaryDto>> GetOwnerFacilitiesAsync(Guid ownerUserId, CancellationToken ct = default)
    {
        var providerIds = await _db.ParkingProviders
            .Where(p => p.OwnerUserId == ownerUserId)
            .Select(p => p.Id)
            .ToListAsync(ct);

        if (providerIds.Count == 0)
            return Array.Empty<FacilitySummaryDto>();

        var facilities = await _db.ParkingFacilities
            .Where(f => providerIds.Contains(f.ProviderId))
            .Include(f => f.Spaces).ThenInclude(s => s.Amenities)
            .Include(f => f.Spaces).ThenInclude(s => s.PricingRules)
            .ToListAsync(ct);

        var result = new List<FacilitySummaryDto>();
        foreach (var facility in facilities)
        {
            var space = facility.Spaces.FirstOrDefault();
            var availableSlots = facility.Spaces.Count(s => s.CurrentStatus != SpaceStatus.Full);
            var cctv = space?.Amenities.Any(a => a.Amenity == AmenityType.CCTV) ?? false;
            var gated = space?.Amenities.Any(a => a.Amenity == AmenityType.Gated) ?? false;
            var ev = space?.Amenities.Any(a => a.Amenity == AmenityType.EVCharging) ?? false;
            var lift = space?.Amenities.Any(a => a.Amenity == AmenityType.Lift) ?? false;
            var handicapped = space?.Amenities.Any(a => a.Amenity == AmenityType.HandicappedAccess) ?? false;
            var guard = space?.Amenities.Any(a => a.Amenity == AmenityType.Guard) ?? false;
            var wellLit = space?.Amenities.Any(a => a.Amenity == AmenityType.WellLit) ?? false;
            var twoWheeler = space?.Amenities.Any(a => a.Amenity == AmenityType.TwoWheeler) ?? false;
            var h24 = space?.Amenities.Any(a => a.Amenity == AmenityType.Hours24x7) ?? false;
            var price = space?.PricingRules.Where(p => p.Unit == PricingUnit.Hour).OrderBy(p => p.BasePrice).Select(p => p.BasePrice).FirstOrDefault();

            result.Add(new FacilitySummaryDto(
                facility.Id,
                facility.Name,
                facility.AddressText,
                facility.Latitude,
                facility.Longitude,
                facility.AccessInstructions,
                space?.Level,
                space?.SlotLabel,
                space?.CostType ?? CostType.Paid,
                price,
                space?.SecurityLevel ?? 3,
                space?.CoveredType == CoveredType.Covered,
                gated,
                cctv,
                ev,
                lift,
                handicapped,
                guard,
                wellLit,
                twoWheeler,
                h24,
                facility.IsApproved,
                availableSlots,
                facility.Spaces.Count,
                space?.MaxVehicleType ?? VehicleType.SUV));
        }

        return result;
    }

    public async Task<FacilityDetailDto> GetFacilityAsync(Guid id, CancellationToken ct = default)
    {
        var facility = await _db.ParkingFacilities
            .Include(f => f.Provider)
                .ThenInclude(p => p!.OwnerUser)
            .Include(f => f.Spaces)
                .ThenInclude(s => s.Amenities)
            .Include(f => f.Spaces)
                .ThenInclude(s => s.PricingRules)
            .Include(f => f.Photos)
            .FirstOrDefaultAsync(f => f.Id == id, ct)
            ?? throw AppException.NotFound("Parking facility");

        var spaces = facility.Spaces
            .OrderBy(s => s.Level)
            .ThenBy(s => s.SlotLabel)
            .Select(s => new FacilitySpaceDto(
                s.Id,
                s.Level,
                s.SlotLabel,
                s.MaxVehicleType,
                s.CostType,
                s.PricingRules.Where(p => p.Unit == PricingUnit.Hour).Select(p => (decimal?)p.BasePrice).FirstOrDefault(),
                s.CurrentStatus,
                s.Amenities.Select(a => a.Amenity).ToList(),
                s.PricingRules.Select(p => new PricingRuleDto(p.Unit, p.BasePrice, p.SuggestedPrice)).ToList()))
            .ToList();

        var photos = facility.Photos
            .OrderBy(p => p.DisplayOrder)
            .Select(p => new FacilityPhotoDto(
                p.Id,
                p.FacilityId,
                p.FileName,
                p.BlobUrl,
                p.DisplayOrder))
            .ToList();

        return new FacilityDetailDto(
            facility.Id,
            facility.Name,
            facility.AddressText,
            facility.Latitude,
            facility.Longitude,
            facility.AccessInstructions,
            facility.Provider?.OwnerUser?.FullName,
            facility.Provider?.OwnerUser?.Email,
            facility.Provider?.OwnerUser?.PhoneNumber,
            facility.IsApproved,
            facility.Spaces.Count(s => s.CurrentStatus != SpaceStatus.Full),
            facility.Spaces.Count,
            spaces,
            photos);
    }

    public async Task<SpaceAvailabilityDto> GetSpaceAvailabilityAsync(Guid id, CancellationToken ct = default)
    {
        var space = await _db.ParkingSpaces
            .Include(s => s.AvailabilityWindows)
            .FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw AppException.NotFound("Parking space");

        return new SpaceAvailabilityDto(
            space.Id,
            space.CurrentStatus,
            space.AvailabilityWindows
                .OrderBy(w => w.DayOfWeek ?? -1)
                .ThenBy(w => w.StartTime)
                .Select(w => new SpaceAvailabilityWindowDto(w.DayOfWeek, w.StartTime, w.EndTime, w.IsRecurring))
                .ToList());
    }

    public async Task<FacilityPhotoDto> UploadPhotoAsync(Guid facilityId, UploadPhotoRequest req, Guid ownerUserId, CancellationToken ct = default)
    {
        var facility = await _db.ParkingFacilities
            .Include(f => f.Provider)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw AppException.NotFound("Parking facility");

        if (facility.Provider?.OwnerUserId != ownerUserId)
            throw AppException.Forbidden("Only the facility owner can upload photos.");

        var displayOrder = await _db.FacilityPhotos
            .Where(p => p.FacilityId == facilityId)
            .CountAsync(ct);

        var photo = new FacilityPhoto
        {
            FacilityId = facilityId,
            FileName = req.FileName,
            BlobUrl = $"data:image/jpeg;base64,{req.Base64Data}",
            DisplayOrder = displayOrder
        };

        _db.FacilityPhotos.Add(photo);
        await _db.SaveChangesAsync(ct);

        return new FacilityPhotoDto(photo.Id, photo.FacilityId, photo.FileName, photo.BlobUrl, photo.DisplayOrder);
    }

    public async Task DeletePhotoAsync(Guid photoId, Guid ownerUserId, CancellationToken ct = default)
    {
        var photo = await _db.FacilityPhotos
            .Include(p => p.Facility)
                .ThenInclude(f => f.Provider)
            .FirstOrDefaultAsync(p => p.Id == photoId, ct)
            ?? throw AppException.NotFound("Photo");

        if (photo.Facility?.Provider?.OwnerUserId != ownerUserId)
            throw AppException.Forbidden("Only the facility owner can delete photos.");

        _db.FacilityPhotos.Remove(photo);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<OwnerDashboardStatisticsDto> GetOwnerDashboardStatisticsAsync(Guid ownerUserId, CancellationToken ct = default)
    {
        // Get all owner's facilities and bookings
        var facilities = await _db.ParkingSpaces
            .Where(s => s.Facility!.Provider!.OwnerUserId == ownerUserId)
            .Include(s => s.Facility)
            .Select(s => s.FacilityId)
            .Distinct()
            .ToListAsync(ct);

        var bookings = await _db.Bookings
            .Where(b => facilities.Contains(b.Space!.FacilityId) && b.Status != BookingStatus.Cancelled)
            .Include(b => b.DriverUser)
            .Include(b => b.Space)
                .ThenInclude(s => s!.Facility)
            .ToListAsync(ct);

        // Calculate total revenue
        var totalRevenue = bookings.Sum(b => b.Amount);
        var avgRevenuePerBooking = bookings.Count > 0 ? totalRevenue / bookings.Count : 0;

        // Revenue by customer (top 5)
        var topCustomers = bookings
            .GroupBy(b => new { b.DriverUser!.Id, b.DriverUser.Email })
            .Select(g => new RevenueByCustomerDto(
                CustomerName: g.FirstOrDefault()?.DriverUser?.FullName ?? "N/A",
                CustomerEmail: g.Key.Email,
                BookingCount: g.Count(),
                TotalRevenue: g.Sum(b => b.Amount),
                LastBookingDate: g.Max(b => b.StartTime)
            ))
            .OrderByDescending(x => x.TotalRevenue)
            .Take(5)
            .ToList();

        // Revenue by facility
        var revenueByFacility = bookings
            .GroupBy(b => new { b.Space!.FacilityId, b.Space.Facility!.Name })
            .Select(g => new RevenueByFacilityDto(
                FacilityId: g.Key.FacilityId,
                FacilityName: g.Key.Name,
                BookingCount: g.Count(),
                TotalRevenue: g.Sum(b => b.Amount),
                AverageRevenuePerBooking: g.Count() > 0 ? g.Sum(b => b.Amount) / g.Count() : 0
            ))
            .OrderByDescending(x => x.TotalRevenue)
            .ToList();

        // Occupancy by hour (sample data based on bookings)
        var occupancyByHour = new List<OccupancyByHourDto>();
        for (int hour = 0; hour < 24; hour++)
        {
            var bookingsInHour = bookings
                .Where(b => b.StartTime.Hour <= hour && b.EndTime.Hour >= hour)
                .Count();
            
            occupancyByHour.Add(new OccupancyByHourDto(
                Hour: hour,
                TotalSlots: facilities.Count * 5, // Assume 5 slots per facility
                OccupiedSlots: bookingsInHour,
                OccupancyPercentage: facilities.Count * 5 > 0 
                    ? (decimal)bookingsInHour / (facilities.Count * 5) * 100 
                    : 0
            ));
        }

        // Customer stickiness (repeat customers)
        var customerStickiness = bookings
            .GroupBy(b => new { b.DriverUser!.Id, b.DriverUser.Email })
            .Where(g => g.Count() >= 2) // Only repeat customers
            .Select(g => 
            {
                var uniqueFacilities = g.Select(b => b.Space!.FacilityId).Distinct().Count();
                var firstBooking = g.Min(b => b.StartTime);
                var lastBooking = g.Max(b => b.StartTime);
                var daysSinceLastBooking = (int)(DateTime.UtcNow - lastBooking).TotalDays;
                var bookingFrequency = (int)Math.Ceiling((decimal)(lastBooking - firstBooking).TotalDays / g.Count());
                var stickinessScore = (decimal)(100 - (daysSinceLastBooking / (bookingFrequency > 0 ? bookingFrequency : 1)));
                stickinessScore = Math.Max(0, Math.Min(100, stickinessScore)); // Clamp 0-100

                return new CustomerStickinessDto(
                    CustomerName: g.FirstOrDefault()?.DriverUser?.FullName ?? "N/A",
                    CustomerEmail: g.Key.Email,
                    TotalBookings: g.Count(),
                    UniqueFacilities: uniqueFacilities,
                    FirstBookingDate: firstBooking,
                    LastBookingDate: lastBooking,
                    DaysSinceLastBooking: daysSinceLastBooking,
                    StickinessScore: stickinessScore
                );
            })
            .OrderByDescending(x => x.StickinessScore)
            .Take(10)
            .ToList();

        return new OwnerDashboardStatisticsDto(
            TotalRevenue: totalRevenue,
            TotalBookings: bookings.Count,
            AverageRevenuePerBooking: avgRevenuePerBooking,
            TopCustomers: topCustomers,
            RevenueByFacility: revenueByFacility,
            OccupancyByHour: occupancyByHour,
            CustomerStickiness: customerStickiness
        );
    }

}

using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Services;

public class ServiceBookingService
{
    private readonly IApplicationDbContext _db;
    public ServiceBookingService(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<ServiceBookingDto>> ListAsync(Guid userId, CancellationToken ct = default) =>
        await _db.ServiceBookings.Where(s => s.UserId == userId)
            .Include(s => s.Facility)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => ToDto(s)).ToListAsync(ct);

    public async Task<ServiceBookingDto> CreateAsync(Guid userId, CreateServiceBookingRequest req, CancellationToken ct = default)
    {
        var facilityService = await _db.FacilityServices
            .Include(s => s.Facility)
            .FirstOrDefaultAsync(s => s.FacilityId == req.FacilityId && s.ServiceType == req.ServiceType, ct)
            ?? throw AppException.NotFound("This service is not offered by the selected facility.");

        if (!facilityService.IsEnabled)
            throw AppException.Conflict("This service is currently unavailable at the selected facility.");

        var booking = new ServiceBooking
        {
            UserId = userId,
            FacilityId = req.FacilityId,
            ServiceType = req.ServiceType,
            Amount = facilityService.Price,
            Status = ServiceBookingStatus.Requested
        };
        _db.ServiceBookings.Add(booking);
        await _db.SaveChangesAsync(ct);

        booking.Facility = facilityService.Facility;
        return ToDto(booking);
    }

    public async Task<ServiceBookingDto> CancelAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var booking = await _db.ServiceBookings
            .Include(s => s.Facility)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw AppException.NotFound("Service booking");
        if (booking.Status is ServiceBookingStatus.Completed or ServiceBookingStatus.Cancelled)
            throw AppException.Conflict("This service booking can no longer be cancelled.");

        booking.Status = ServiceBookingStatus.Cancelled;
        await _db.SaveChangesAsync(ct);
        return ToDto(booking);
    }

    public async Task<IReadOnlyList<OwnerServiceBookingDto>> ListForFacilityAsync(Guid facilityId, Guid ownerUserId, CancellationToken ct = default)
    {
        var facility = await _db.ParkingFacilities
            .Include(f => f.Provider)
            .FirstOrDefaultAsync(f => f.Id == facilityId, ct)
            ?? throw AppException.NotFound("Parking facility");

        if (facility.Provider?.OwnerUserId != ownerUserId)
            throw AppException.Forbidden("Only the facility owner can view this facility's service bookings.");

        return await _db.ServiceBookings
            .Where(s => s.FacilityId == facilityId)
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new OwnerServiceBookingDto(
                s.Id, s.ServiceType, s.Amount, s.Status, s.CreatedAt,
                s.User!.FullName, s.User.Email))
            .ToListAsync(ct);
    }

    private static ServiceBookingDto ToDto(ServiceBooking s) =>
        new(s.Id, s.FacilityId, s.Facility?.Name ?? string.Empty, s.ServiceType, s.Amount, s.Status, s.CreatedAt);
}

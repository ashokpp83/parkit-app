using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Services;

public class BookingService
{
    private readonly IApplicationDbContext _db;

    // Booking lifecycle policy constants (Phase 1 defaults).
    private const int GracePeriodMinutes = 15;
    private const decimal CommissionRate = 0.10m;

    public BookingService(IApplicationDbContext db) => _db = db;

    public async Task<BookingDto> CreateAsync(Guid driverId, CreateBookingRequest req, CancellationToken ct = default)
    {
        if (req.EndTime <= req.StartTime)
            throw new AppException("invalid_time", "End time must be after start time.");

        var vehicle = await _db.Vehicles.FirstOrDefaultAsync(v => v.Id == req.VehicleId && v.UserId == driverId, ct)
            ?? throw AppException.NotFound("Vehicle");

        var space = await _db.ParkingSpaces
            .Include(s => s.Facility)
            .Include(s => s.PricingRules)
            .FirstOrDefaultAsync(s => s.Id == req.SpaceId && s.IsActive, ct)
            ?? throw AppException.NotFound("Parking space");
        if (space.CurrentStatus == SpaceStatus.Full)
            throw AppException.Conflict("This space is already occupied.");

        // Vehicle compatibility check against the space ceiling.
        if ((int)vehicle.Type > (int)space.MaxVehicleType)
            throw new AppException("incompatible_vehicle", "Your vehicle is too large for this space.");

        // Overlap check: reject if an active booking already covers the requested window.
        bool overlaps = await _db.Bookings.AnyAsync(b =>
            b.SpaceId == req.SpaceId &&
            (b.Status == BookingStatus.Pending || b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.CheckedIn) &&
            b.StartTime < req.EndTime && req.StartTime < b.EndTime, ct);
        if (overlaps)
            throw AppException.Conflict("This space is already booked for the selected time window.");

        var amount = CalculateAmount(space, req.StartTime, req.EndTime);
        var booking = new Booking
        {
            DriverUserId = driverId,
            SpaceId = space.Id,
            VehicleId = vehicle.Id,
            GuestName = req.GuestName,
            StartTime = req.StartTime,
            EndTime = req.EndTime,
            Status = space.CostType == CostType.Free ? BookingStatus.Confirmed : BookingStatus.Pending,
            GraceExpiresAt = req.StartTime.AddMinutes(GracePeriodMinutes),
            IsGuaranteed = space.VerificationStatus == VerificationStatus.Verified,
            Amount = amount,
            QrToken = Guid.NewGuid().ToString("N")
        };
        _db.Bookings.Add(booking);
        space.CurrentStatus = SpaceStatus.Full;

        if (space.CostType == CostType.Paid)
        {
            _db.Payments.Add(new Payment
            {
                BookingId = booking.Id,
                Amount = amount,
                Method = PaymentMethod.UPI,
                Status = PaymentStatus.Pending,
                CommissionAmount = Math.Round(amount * CommissionRate, 2)
            });
        }

        await _db.SaveChangesAsync(ct);
        return await GetAsync(driverId, booking.Id, ct);
    }

    public async Task<IReadOnlyList<BookingDto>> ListForDriverAsync(Guid driverId, CancellationToken ct = default) =>
        await ProjectDtos(_db.Bookings.Where(b => b.DriverUserId == driverId)
            .OrderByDescending(b => b.StartTime), ct);

    public async Task<IReadOnlyList<BookingDto>> ListForOwnerAsync(Guid ownerUserId, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == ownerUserId, ct)
            ?? throw AppException.NotFound("User");
        if (user.Role != UserRole.Owner)
            throw AppException.Forbidden("Only facility owners can view facility booking history.");

        return await ProjectDtos(
            _db.Bookings
                .Where(b => b.Space!.Facility!.Provider!.OwnerUserId == ownerUserId)
                .OrderByDescending(b => b.StartTime),
            ct);
    }

    public async Task<BookingDto> GetAsync(Guid driverId, Guid id, CancellationToken ct = default)
    {
        var dto = (await ProjectDtos(_db.Bookings.Where(b => b.Id == id && b.DriverUserId == driverId), ct))
            .FirstOrDefault();
        return dto ?? throw AppException.NotFound("Booking");
    }

    public async Task<BookingDto> CancelAsync(Guid driverId, Guid id, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.DriverUserId == driverId, ct)
            ?? throw AppException.NotFound("Booking");
        if (booking.Status is BookingStatus.Completed or BookingStatus.Cancelled)
            throw AppException.Conflict("Booking can no longer be cancelled.");
        booking.Status = BookingStatus.Cancelled;
        var space = await _db.ParkingSpaces.FirstOrDefaultAsync(s => s.Id == booking.SpaceId, ct);
        if (space is not null)
            space.CurrentStatus = space.VerificationStatus == VerificationStatus.Verified ? SpaceStatus.Guaranteed : SpaceStatus.LikelyAvailable;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await GetAsync(driverId, id, ct);
    }

    /// <summary>
    /// Simulated payment capture (no real payment gateway is integrated). Marks the
    /// booking's pending payment as captured and confirms the booking.
    /// </summary>
    public async Task<BookingDto> PayAsync(Guid driverId, Guid id, PayBookingRequest req, CancellationToken ct = default)
    {
        var booking = await _db.Bookings
            .Include(b => b.Payment)
            .FirstOrDefaultAsync(b => b.Id == id && b.DriverUserId == driverId, ct)
            ?? throw AppException.NotFound("Booking");

        if (booking.Status is BookingStatus.Cancelled or BookingStatus.Completed)
            throw AppException.Conflict("This booking can no longer be paid.");

        if (booking.Payment is null)
        {
            // Free spaces never get a Payment row; nothing to capture.
            if (booking.Amount <= 0) return await GetAsync(driverId, id, ct);
            throw AppException.NotFound("Payment");
        }

        if (booking.Payment.Status == PaymentStatus.Captured)
            throw AppException.Conflict("This booking has already been paid.");

        booking.Payment.Method = req.Method;
        booking.Payment.Status = PaymentStatus.Captured;
        booking.Payment.GatewayReference = $"SIM-{Guid.NewGuid():N}"[..16].ToUpperInvariant();

        if (booking.Status == BookingStatus.Pending)
            booking.Status = BookingStatus.Confirmed;
        booking.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(driverId, id, ct);
    }

    public async Task<object> GetQrAsync(Guid driverId, Guid id, CancellationToken ct = default)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.DriverUserId == driverId, ct)
            ?? throw AppException.NotFound("Booking");
        // Offline-capable payload: everything an attendant needs without a network call.
        return new
        {
            bookingId = booking.Id,
            qrToken = booking.QrToken,
            spaceId = booking.SpaceId,
            vehicleId = booking.VehicleId,
            startTime = booking.StartTime,
            endTime = booking.EndTime,
            status = booking.Status.ToString()
        };
    }

    private decimal CalculateAmount(ParkingSpace space, DateTime start, DateTime end)
    {
        if (space.CostType == CostType.Free) return 0m;
        var hourly = space.PricingRules.FirstOrDefault(p => p.Unit == PricingUnit.Hour)?.BasePrice
                     ?? space.PricingRules.Select(p => (decimal?)p.BasePrice).FirstOrDefault() ?? 0m;
        var hours = Math.Ceiling((end - start).TotalHours);
        return Math.Round(hourly * (decimal)hours, 2);
    }

    private static async Task<IReadOnlyList<BookingDto>> ProjectDtos(IQueryable<Booking> query, CancellationToken ct) =>
        await query.Select(b => new BookingDto(
            b.Id,
            b.SpaceId,
            b.Space!.Facility!.Name,
            b.Space.SlotLabel,
            b.VehicleId,
            b.Vehicle!.RegistrationNumber,
            b.StartTime,
            b.EndTime,
            b.Status,
            b.IsGuaranteed,
            b.Amount,
            b.GraceExpiresAt,
            b.QrToken,
            b.DriverUser!.FullName,
            b.DriverUser.Email,
            b.DriverUser.PhoneNumber,
            b.Space!.Facility!.Provider!.OwnerUser!.FullName,
            b.Space.Facility.Provider.OwnerUser.Email,
            b.Space.Facility.Provider.OwnerUser.PhoneNumber,
            b.Payment == null ? (PaymentStatus?)null : b.Payment.Status,
            b.Payment == null ? (PaymentMethod?)null : b.Payment.Method,
            b.Payment == null ? null : b.Payment.GatewayReference)).ToListAsync(ct);
}

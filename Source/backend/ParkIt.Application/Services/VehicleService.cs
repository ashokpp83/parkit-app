using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;

namespace ParkIt.Application.Services;

public class VehicleService
{
    private readonly IApplicationDbContext _db;
    public VehicleService(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<VehicleDto>> ListAsync(Guid userId, CancellationToken ct = default) =>
        await _db.Vehicles.Where(v => v.UserId == userId)
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => ToDto(v)).ToListAsync(ct);

    public async Task<VehicleDto> AddAsync(Guid userId, UpsertVehicleRequest req, CancellationToken ct = default)
    {
        var reg = req.RegistrationNumber.Trim().ToUpperInvariant();
        if (await _db.Vehicles.AnyAsync(v => v.UserId == userId && v.RegistrationNumber == reg, ct))
            throw AppException.Conflict("This vehicle is already registered.");

        var vehicle = new Vehicle
        {
            UserId = userId,
            RegistrationNumber = reg,
            Type = req.Type,
            Length = req.Length,
            Width = req.Width,
            Height = req.Height
        };
        _db.Vehicles.Add(vehicle);
        await _db.SaveChangesAsync(ct);
        return ToDto(vehicle);
    }

    public async Task<VehicleDto> UpdateAsync(Guid userId, Guid id, UpsertVehicleRequest req, CancellationToken ct = default)
    {
        var vehicle = await Owned(userId, id, ct);
        vehicle.RegistrationNumber = req.RegistrationNumber.Trim().ToUpperInvariant();
        vehicle.Type = req.Type;
        vehicle.Length = req.Length;
        vehicle.Width = req.Width;
        vehicle.Height = req.Height;
        vehicle.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return ToDto(vehicle);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var vehicle = await Owned(userId, id, ct);
        _db.Vehicles.Remove(vehicle);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<Vehicle> Owned(Guid userId, Guid id, CancellationToken ct) =>
        await _db.Vehicles.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId, ct)
        ?? throw AppException.NotFound("Vehicle");

    private static VehicleDto ToDto(Vehicle v) =>
        new(v.Id, v.RegistrationNumber, v.Type, v.Length, v.Width, v.Height, v.IsVerified);
}

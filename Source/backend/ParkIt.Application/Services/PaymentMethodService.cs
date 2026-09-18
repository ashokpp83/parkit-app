using Microsoft.EntityFrameworkCore;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Domain.Entities;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Services;

public class PaymentMethodService
{
    private readonly IApplicationDbContext _db;
    public PaymentMethodService(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<SavedPaymentMethodDto>> ListAsync(Guid userId, CancellationToken ct = default) =>
        await _db.SavedPaymentMethods.Where(m => m.UserId == userId)
            .OrderByDescending(m => m.IsDefault).ThenByDescending(m => m.CreatedAt)
            .Select(m => ToDto(m)).ToListAsync(ct);

    public async Task<SavedPaymentMethodDto> AddAsync(Guid userId, AddPaymentMethodRequest req, CancellationToken ct = default)
    {
        if (req.Method is PaymentMethod.Card && (string.IsNullOrWhiteSpace(req.Last4) || req.ExpiryMonth is null || req.ExpiryYear is null))
            throw AppException.BadRequest("Card payment methods require last4 and expiry.");

        if (req.IsDefault)
            await ClearDefaultAsync(userId, ct);

        var method = new SavedPaymentMethod
        {
            UserId = userId,
            Method = req.Method,
            Brand = req.Brand?.Trim(),
            Last4 = req.Last4?.Trim(),
            ExpiryMonth = req.ExpiryMonth,
            ExpiryYear = req.ExpiryYear,
            GatewayToken = req.GatewayToken,
            IsDefault = req.IsDefault
        };
        _db.SavedPaymentMethods.Add(method);
        await _db.SaveChangesAsync(ct);
        return ToDto(method);
    }

    public async Task SetDefaultAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var method = await Owned(userId, id, ct);
        await ClearDefaultAsync(userId, ct);
        method.IsDefault = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Guid userId, Guid id, CancellationToken ct = default)
    {
        var method = await Owned(userId, id, ct);
        _db.SavedPaymentMethods.Remove(method);
        await _db.SaveChangesAsync(ct);
    }

    private async Task ClearDefaultAsync(Guid userId, CancellationToken ct)
    {
        var current = await _db.SavedPaymentMethods.Where(m => m.UserId == userId && m.IsDefault).ToListAsync(ct);
        foreach (var m in current) m.IsDefault = false;
    }

    private async Task<SavedPaymentMethod> Owned(Guid userId, Guid id, CancellationToken ct) =>
        await _db.SavedPaymentMethods.FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId, ct)
        ?? throw AppException.NotFound("Payment method");

    private static SavedPaymentMethodDto ToDto(SavedPaymentMethod m) =>
        new(m.Id, m.Method, m.Brand, m.Last4, m.ExpiryMonth, m.ExpiryYear, m.IsDefault);
}

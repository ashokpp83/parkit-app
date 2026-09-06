using System.ComponentModel.DataAnnotations;
using ParkIt.Domain.Enums;

namespace ParkIt.Application.Dtos;

public record VehicleDto(
    Guid Id,
    string RegistrationNumber,
    VehicleType Type,
    decimal? Length,
    decimal? Width,
    decimal? Height,
    bool IsVerified);

public record UpsertVehicleRequest(
    [Required] string RegistrationNumber,
    VehicleType Type,
    decimal? Length,
    decimal? Width,
    decimal? Height);

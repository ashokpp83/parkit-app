using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/service-bookings")]
public class ServiceBookingsController : ControllerBase
{
    private readonly ServiceBookingService _services;
    private readonly ICurrentUser _currentUser;

    public ServiceBookingsController(ServiceBookingService services, ICurrentUser currentUser)
    {
        _services = services;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ServiceBookingDto>>> List(CancellationToken ct)
        => Ok(await _services.ListAsync(_currentUser.RequireUserId(), ct));

    [HttpPost]
    public async Task<ActionResult<ServiceBookingDto>> Create(CreateServiceBookingRequest req, CancellationToken ct)
        => Ok(await _services.CreateAsync(_currentUser.RequireUserId(), req, ct));

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<ServiceBookingDto>> Cancel(Guid id, CancellationToken ct)
        => Ok(await _services.CancelAsync(_currentUser.RequireUserId(), id, ct));

    [HttpGet("facility/{facilityId:guid}")]
    public async Task<ActionResult<IReadOnlyList<OwnerServiceBookingDto>>> ListForFacility(Guid facilityId, CancellationToken ct)
        => Ok(await _services.ListForFacilityAsync(facilityId, _currentUser.RequireUserId(), ct));
}

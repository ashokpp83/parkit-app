using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/vehicles")]
public class VehiclesController : ControllerBase
{
    private readonly VehicleService _vehicles;
    private readonly ICurrentUser _currentUser;

    public VehiclesController(VehicleService vehicles, ICurrentUser currentUser)
    {
        _vehicles = vehicles;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<VehicleDto>>> List(CancellationToken ct)
        => Ok(await _vehicles.ListAsync(_currentUser.RequireUserId(), ct));

    [HttpPost]
    public async Task<ActionResult<VehicleDto>> Add(UpsertVehicleRequest req, CancellationToken ct)
        => Ok(await _vehicles.AddAsync(_currentUser.RequireUserId(), req, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VehicleDto>> Update(Guid id, UpsertVehicleRequest req, CancellationToken ct)
        => Ok(await _vehicles.UpdateAsync(_currentUser.RequireUserId(), id, req, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _vehicles.DeleteAsync(_currentUser.RequireUserId(), id, ct);
        return NoContent();
    }
}

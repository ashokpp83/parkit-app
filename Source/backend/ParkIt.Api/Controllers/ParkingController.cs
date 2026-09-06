using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;
using ParkIt.Domain.Enums;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/parking")]
public class ParkingController : ControllerBase
{
    private readonly ParkingService _parking;
    private readonly ICurrentUser _currentUser;

    public ParkingController(ParkingService parking, ICurrentUser currentUser)
    {
        _parking = parking;
        _currentUser = currentUser;
    }

    [HttpGet("search")]
    public async Task<ActionResult<PagedResult<SpaceSearchResult>>> Search(
        [FromQuery] double lat,
        [FromQuery] double lng,
        [FromQuery] double radiusKm = 3,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] VehicleType? vehicleType = null,
        [FromQuery] CostType? costType = null,
        [FromQuery] bool? covered = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var query = new ParkingSearchQuery
        {
            Latitude = lat,
            Longitude = lng,
            RadiusKm = radiusKm,
            MaxPrice = maxPrice,
            VehicleType = vehicleType,
            CostType = costType,
            Covered = covered,
            Page = page,
            PageSize = pageSize
        };
        return Ok(await _parking.SearchAsync(query, ct));
    }

    [HttpGet("spaces/{id:guid}")]
    public async Task<ActionResult<SpaceDetailDto>> GetSpace(Guid id, CancellationToken ct)
        => Ok(await _parking.GetSpaceAsync(id, ct));

    [HttpGet("spaces/{id:guid}/availability")]
    public async Task<ActionResult<SpaceAvailabilityDto>> GetSpaceAvailability(Guid id, CancellationToken ct)
        => Ok(await _parking.GetSpaceAvailabilityAsync(id, ct));

    [HttpGet("facilities/{id:guid}")]
    public async Task<ActionResult<FacilityDetailDto>> GetFacility(Guid id, CancellationToken ct)
        => Ok(await _parking.GetFacilityAsync(id, ct));

    [HttpPost("facilities")]
    public async Task<ActionResult<FacilitySummaryDto>> CreateFacility([FromBody] FacilityCreateRequest req, CancellationToken ct)
        => Ok(await _parking.CreateFacilityAsync(req, _currentUser.RequireUserId(), ct));

    [HttpPut("facilities/{id:guid}")]
    public async Task<ActionResult<FacilitySummaryDto>> UpdateFacility(Guid id, [FromBody] FacilityCreateRequest req, CancellationToken ct)
        => Ok(await _parking.UpdateFacilityAsync(id, req, _currentUser.RequireUserId(), ct));

    [HttpGet("facilities/my")]
    public async Task<ActionResult<IReadOnlyList<FacilitySummaryDto>>> GetMyFacilities(CancellationToken ct)
        => Ok(await _parking.GetOwnerFacilitiesAsync(_currentUser.RequireUserId(), ct));

    [HttpPost("facilities/{facilityId:guid}/photos")]
    public async Task<ActionResult<FacilityPhotoDto>> UploadPhoto(Guid facilityId, [FromBody] UploadPhotoRequest req, CancellationToken ct)
        => Ok(await _parking.UploadPhotoAsync(facilityId, req, _currentUser.RequireUserId(), ct));

    [HttpDelete("photos/{photoId:guid}")]
    public async Task<IActionResult> DeletePhoto(Guid photoId, CancellationToken ct)
    {
        await _parking.DeletePhotoAsync(photoId, _currentUser.RequireUserId(), ct);
        return NoContent();
    }

    [HttpGet("owner/dashboard/statistics")]
    public async Task<ActionResult<OwnerDashboardStatisticsDto>> GetDashboardStatistics(CancellationToken ct)
        => Ok(await _parking.GetOwnerDashboardStatisticsAsync(_currentUser.RequireUserId(), ct));
}

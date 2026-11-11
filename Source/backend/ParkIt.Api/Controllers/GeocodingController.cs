using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Api.Infrastructure;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/geocoding")]
public class GeocodingController : ControllerBase
{
    private readonly GeocodingProxy _geocoding;
    public GeocodingController(GeocodingProxy geocoding) => _geocoding = geocoding;

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int limit = 5, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length > 200 || limit is < 1 or > 5)
            return BadRequest(new { error = new { message = "Enter a location of up to 200 characters." } });
        var result = await _geocoding.SearchAsync(q.Trim(), limit, ct);
        return Content(result, "application/json");
    }

    [HttpGet("reverse")]
    public async Task<IActionResult> Reverse([FromQuery] double? lat, [FromQuery] double? lng, CancellationToken ct)
    {
        if (lat is null || lng is null || !double.IsFinite(lat.Value) || !double.IsFinite(lng.Value) ||
            lat is < -90 or > 90 || lng is < -180 or > 180)
            return BadRequest(new { error = new { message = "Enter valid coordinates." } });
        var result = await _geocoding.ReverseAsync(lat.Value, lng.Value, ct);
        return Content(result, "application/json");
    }
}

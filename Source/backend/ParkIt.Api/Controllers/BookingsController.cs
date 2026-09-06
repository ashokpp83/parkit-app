using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _bookings;
    private readonly ICurrentUser _currentUser;

    public BookingsController(BookingService bookings, ICurrentUser currentUser)
    {
        _bookings = bookings;
        _currentUser = currentUser;
    }

    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingRequest req, CancellationToken ct)
        => Ok(await _bookings.CreateAsync(_currentUser.RequireUserId(), req, ct));

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BookingDto>>> List(CancellationToken ct)
        => Ok(await _bookings.ListForDriverAsync(_currentUser.RequireUserId(), ct));

    [HttpGet("owner")]
    public async Task<ActionResult<IReadOnlyList<BookingDto>>> ListForOwner(CancellationToken ct)
        => Ok(await _bookings.ListForOwnerAsync(_currentUser.RequireUserId(), ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BookingDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _bookings.GetAsync(_currentUser.RequireUserId(), id, ct));

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<BookingDto>> Cancel(Guid id, CancellationToken ct)
        => Ok(await _bookings.CancelAsync(_currentUser.RequireUserId(), id, ct));

    [HttpPost("{id:guid}/pay")]
    public async Task<ActionResult<BookingDto>> Pay(Guid id, PayBookingRequest req, CancellationToken ct)
        => Ok(await _bookings.PayAsync(_currentUser.RequireUserId(), id, req, ct));

    [HttpGet("{id:guid}/qr")]
    public async Task<IActionResult> Qr(Guid id, CancellationToken ct)
        => Ok(await _bookings.GetQrAsync(_currentUser.RequireUserId(), id, ct));
}

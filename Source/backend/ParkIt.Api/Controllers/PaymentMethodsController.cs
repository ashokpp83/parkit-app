using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;

namespace ParkIt.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/payment-methods")]
public class PaymentMethodsController : ControllerBase
{
    private readonly PaymentMethodService _methods;
    private readonly ICurrentUser _currentUser;

    public PaymentMethodsController(PaymentMethodService methods, ICurrentUser currentUser)
    {
        _methods = methods;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SavedPaymentMethodDto>>> List(CancellationToken ct)
        => Ok(await _methods.ListAsync(_currentUser.RequireUserId(), ct));

    [HttpPost]
    public async Task<ActionResult<SavedPaymentMethodDto>> Add(AddPaymentMethodRequest req, CancellationToken ct)
        => Ok(await _methods.AddAsync(_currentUser.RequireUserId(), req, ct));

    [HttpPost("{id:guid}/default")]
    public async Task<IActionResult> SetDefault(Guid id, CancellationToken ct)
    {
        await _methods.SetDefaultAsync(_currentUser.RequireUserId(), id, ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _methods.DeleteAsync(_currentUser.RequireUserId(), id, ct);
        return NoContent();
    }
}

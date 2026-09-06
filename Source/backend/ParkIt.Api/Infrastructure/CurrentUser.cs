using System.Security.Claims;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Common;
using ParkIt.Domain.Enums;

namespace ParkIt.Api.Infrastructure;

/// <summary>Resolves the authenticated user from the HTTP context's JWT claims.</summary>
public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    private ClaimsPrincipal? Principal => _accessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId
    {
        get
        {
            var id = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(id, out var guid) ? guid : null;
        }
    }

    public UserRole? Role =>
        Enum.TryParse<UserRole>(Principal?.FindFirstValue(ClaimTypes.Role), out var r) ? r : null;

    public Guid RequireUserId() => UserId ?? throw AppException.Unauthorized();
}

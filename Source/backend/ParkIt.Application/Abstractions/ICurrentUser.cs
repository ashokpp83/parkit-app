using ParkIt.Domain.Enums;

namespace ParkIt.Application.Abstractions;

/// <summary>Access to the authenticated user for the current request.</summary>
public interface ICurrentUser
{
    Guid? UserId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
    Guid RequireUserId();
}

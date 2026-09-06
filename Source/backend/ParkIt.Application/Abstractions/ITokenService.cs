using ParkIt.Domain.Entities;

namespace ParkIt.Application.Abstractions;

public record TokenPair(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt);

public interface ITokenService
{
    TokenPair CreateTokens(User user);
    string CreateRefreshToken();
}

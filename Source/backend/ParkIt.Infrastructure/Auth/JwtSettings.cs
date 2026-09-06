namespace ParkIt.Infrastructure.Auth;

public class JwtSettings
{
    public string Issuer { get; set; } = "ParkIt";
    public string Audience { get; set; } = "ParkItClients";
    public string Key { get; set; } = "dev-only-super-secret-key-change-me-please-32bytes!";
    public int AccessTokenMinutes { get; set; } = 60;
}

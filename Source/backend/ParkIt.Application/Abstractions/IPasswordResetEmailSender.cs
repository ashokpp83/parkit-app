namespace ParkIt.Application.Abstractions;

public interface IPasswordResetEmailSender
{
    void EnsureConfigured();
    Task SendAsync(string email, string token, CancellationToken ct);
}

using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using ParkIt.Application.Abstractions;

namespace ParkIt.Infrastructure.Auth;

public class SmtpPasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly IConfiguration _config;

    public SmtpPasswordResetEmailSender(IConfiguration config) => _config = config;

    public void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_config["Smtp:Host"]) ||
            string.IsNullOrWhiteSpace(_config["Smtp:From"]) ||
            string.IsNullOrWhiteSpace(_config["Smtp:Username"]) ||
            string.IsNullOrWhiteSpace(_config["Smtp:Password"]) ||
            !Uri.TryCreate(_config["FrontendOrigin"], UriKind.Absolute, out var origin) ||
            (origin.Scheme != Uri.UriSchemeHttps && !(origin.IsLoopback && origin.Scheme == Uri.UriSchemeHttp)) ||
            origin.AbsolutePath != "/" || !string.IsNullOrEmpty(origin.Query) || !string.IsNullOrEmpty(origin.Fragment))
            throw new InvalidOperationException("Password reset email is not configured correctly.");
    }

    public async Task SendAsync(string email, string token, CancellationToken ct)
    {
        EnsureConfigured();
        var link = $"{_config["FrontendOrigin"]!.TrimEnd('/')}/reset-password#{token}";
        using var message = new MailMessage(_config["Smtp:From"]!, email)
        {
            Subject = "Reset your ParkIt password",
            Body = $"Use this link within 30 minutes to reset your ParkIt password:\n\n{link}\n\nIf you did not request this, ignore this email."
        };
        using var client = new SmtpClient(_config["Smtp:Host"]!, _config.GetValue("Smtp:Port", 587))
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(_config["Smtp:Username"], _config["Smtp:Password"])
        };
        await client.SendMailAsync(message, ct);
    }
}

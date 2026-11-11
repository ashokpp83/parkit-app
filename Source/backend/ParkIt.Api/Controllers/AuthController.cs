using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ParkIt.Application.Abstractions;
using ParkIt.Application.Dtos;
using ParkIt.Application.Services;

namespace ParkIt.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly ICurrentUser _currentUser;
    private readonly IWebHostEnvironment _env;

    public AuthController(AuthService auth, ICurrentUser currentUser, IWebHostEnvironment env)
    {
        _auth = auth;
        _currentUser = currentUser;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req, CancellationToken ct)
        => Ok(await _auth.RegisterAsync(req, ct));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct)
        => Ok(await _auth.LoginAsync(req, ct));

    [EnableRateLimiting("password-recovery")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest req, CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(req, ct);
        return Ok(new { message = "If an account exists for that email, a reset link has been sent." });
    }

    [EnableRateLimiting("password-recovery")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest req, CancellationToken ct)
    {
        await _auth.ResetPasswordAsync(req, ct);
        return Ok(new { message = "Password updated. Please sign in." });
    }

    [HttpPost("login/otp")]
    public async Task<ActionResult<AuthResponse>> LoginWithOtp(OtpLoginRequest req, CancellationToken ct)
        => Ok(await _auth.LoginWithOtpAsync(req, ct));

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest req, CancellationToken ct)
        => Ok(await _auth.RefreshAsync(req, ct));

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(RefreshRequest req, CancellationToken ct)
    {
        await _auth.LogoutAsync(req.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("otp/send")]
    public async Task<IActionResult> SendOtp(OtpSendRequest req, CancellationToken ct)
    {
        var code = await _auth.SendOtpAsync(req, ct);
        // In development we echo the code back so the flow is testable without an SMS gateway.
        return Ok(_env.IsDevelopment() ? new { sent = true, devCode = (string?)code } : new { sent = true, devCode = (string?)null });
    }

    [HttpPost("otp/verify")]
    public async Task<IActionResult> VerifyOtp(OtpVerifyRequest req, CancellationToken ct)
    {
        await _auth.VerifyOtpAsync(req, ct);
        return Ok(new { verified = true });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
        => Ok(await _auth.GetProfileAsync(_currentUser.RequireUserId(), ct));
}

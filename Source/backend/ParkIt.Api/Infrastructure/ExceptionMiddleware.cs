using System.Text.Json;
using ParkIt.Application.Common;

namespace ParkIt.Api.Infrastructure;

/// <summary>Converts exceptions into the standard error envelope: { error: { code, message } }.</summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            await WriteError(context, ex.StatusCode, ex.Code, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            await WriteError(context, 500, "server_error", "An unexpected error occurred.");
        }
    }

    private static async Task WriteError(HttpContext ctx, int status, string code, string message)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        var payload = new { error = new { code, message } };
        await ctx.Response.WriteAsync(JsonSerializer.Serialize(payload,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}

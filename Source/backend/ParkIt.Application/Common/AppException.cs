namespace ParkIt.Application.Common;

/// <summary>Domain/validation error surfaced to the API as a structured error envelope.</summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }

    public AppException(string code, string message, int statusCode = 400) : base(message)
    {
        Code = code;
        StatusCode = statusCode;
    }

    public static AppException BadRequest(string msg) => new("bad_request", msg, 400);
    public static AppException NotFound(string what) => new("not_found", $"{what} not found.", 404);
    public static AppException Unauthorized(string msg = "Unauthorized.") => new("unauthorized", msg, 401);
    public static AppException Forbidden(string msg = "Forbidden.") => new("forbidden", msg, 403);
    public static AppException Conflict(string msg) => new("conflict", msg, 409);
}

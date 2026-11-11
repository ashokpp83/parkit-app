using System.Globalization;
using System.Net.Http.Headers;
using Microsoft.Extensions.Caching.Memory;

namespace ParkIt.Api.Infrastructure;

public sealed class GeocodingProxy : IDisposable
{
    private readonly HttpClient _client;
    private readonly string _baseUrl;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly MemoryCache _cache = new(new MemoryCacheOptions { SizeLimit = 1000 });
    private DateTimeOffset _lastRequest = DateTimeOffset.MinValue;

    public GeocodingProxy(HttpClient client, IConfiguration config)
    {
        _client = client;
        var configured = config["Geocoding:BaseUrl"] ?? "https://nominatim.openstreetmap.org";
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && !(uri.IsLoopback && uri.Scheme == Uri.UriSchemeHttp)) ||
            !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment))
            throw new InvalidOperationException("Geocoding:BaseUrl must be an HTTPS URL.");
        _baseUrl = configured.TrimEnd('/');
        _client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("ParkIt", "1.0"));
        _client.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("(+https://github.com/ashokpp83/parkit-app)"));
    }

    public Task<string> SearchAsync(string query, int limit, CancellationToken ct) =>
        GetAsync($"search?format=jsonv2&q={Uri.EscapeDataString(query)}&addressdetails=1&limit={limit}&countrycodes=in", ct);

    public Task<string> ReverseAsync(double lat, double lng, CancellationToken ct) =>
        GetAsync($"reverse?format=jsonv2&lat={lat.ToString(CultureInfo.InvariantCulture)}&lon={lng.ToString(CultureInfo.InvariantCulture)}", ct);

    private async Task<string> GetAsync(string path, CancellationToken ct)
    {
        if (_cache.TryGetValue(path, out string? cached) && cached is not null) return cached;
        await _gate.WaitAsync(ct);
        try
        {
            if (_cache.TryGetValue(path, out cached) && cached is not null) return cached;
            var delay = _lastRequest.AddSeconds(1) - DateTimeOffset.UtcNow;
            if (delay > TimeSpan.Zero) await Task.Delay(delay, ct);
            _lastRequest = DateTimeOffset.UtcNow;
            var result = await _client.GetStringAsync($"{_baseUrl}/{path}", ct);
            _cache.Set(path, result, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) });
            return result;
        }
        finally
        {
            _gate.Release();
        }
    }

    public void Dispose()
    {
        _cache.Dispose();
        _gate.Dispose();
        _client.Dispose();
    }
}

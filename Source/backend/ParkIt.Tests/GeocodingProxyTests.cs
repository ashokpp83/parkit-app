using System.Diagnostics;
using System.Net;
using Microsoft.Extensions.Configuration;
using ParkIt.Api.Infrastructure;
using Xunit;

namespace ParkIt.Tests;

public class GeocodingProxyTests
{
    [Fact]
    public async Task CachesIdenticalRequestsAndSpacesDistinctRequests()
    {
        var handler = new RecordingHandler();
        using var proxy = new GeocodingProxy(new HttpClient(handler), new ConfigurationBuilder().Build());
        var watch = Stopwatch.StartNew();
        await proxy.SearchAsync("Chennai", 1, CancellationToken.None);
        await proxy.SearchAsync("Chennai", 1, CancellationToken.None);
        Assert.Single(handler.Requests);
        await proxy.SearchAsync("Mumbai", 1, CancellationToken.None);
        Assert.Equal(2, handler.Requests.Count);
        Assert.True(watch.Elapsed >= TimeSpan.FromMilliseconds(900), $"Requests were too close: {watch.Elapsed}");
        Assert.Contains("countrycodes=in", handler.Requests[0]);
    }

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public List<string> Requests { get; } = [];
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request.RequestUri!.ToString());
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("[]") });
        }
    }
}

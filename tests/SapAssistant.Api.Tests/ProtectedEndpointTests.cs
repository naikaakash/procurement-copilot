using System.Net;
using System.Net.Http.Json;

namespace SapAssistant.Api.Tests;

public class ProtectedEndpointTests(SapAssistantFactory factory) : IClassFixture<SapAssistantFactory>
{
    private readonly HttpClient _client = factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
    });

    [Fact]
    public async Task Me_returns_401_when_unauthenticated()
    {
        var resp = await _client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Contest_post_returns_401_when_unauthenticated()
    {
        var resp = await _client.PostAsync("/api/contest", content: null);
        var loc = resp.Headers.Location?.ToString();
        Assert.True(resp.StatusCode == HttpStatusCode.Unauthorized,
            $"Got {(int)resp.StatusCode} {resp.StatusCode}; Location={loc}");
    }

    [Fact]
    public async Task Chat_post_returns_401_when_unauthenticated()
    {
        var payload = new { History = Array.Empty<object>(), Message = "hello" };
        var resp = await _client.PostAsJsonAsync("/api/chat", payload);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Root_redirects_to_frontend()
    {
        var resp = await _client.GetAsync("/");
        Assert.Equal(HttpStatusCode.Redirect, resp.StatusCode);
        Assert.Equal("http://localhost:5173", resp.Headers.Location?.ToString().TrimEnd('/'));
    }
}

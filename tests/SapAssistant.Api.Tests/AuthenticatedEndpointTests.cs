using System.Net;
using System.Net.Http.Json;
using SapAssistant.Api.Endpoints;

namespace SapAssistant.Api.Tests;

/// <summary>
/// End-to-end tests of the protected endpoints from the "happy path" side:
/// hit /api/test/signin first (only registered in Testing env), then exercise
/// /api/contest + /api/chat with the resulting auth cookie.
/// </summary>
public class AuthenticatedEndpointTests(SapAssistantFactory factory)
    : IClassFixture<SapAssistantFactory>
{
    private readonly SapAssistantFactory _factory = factory;

    private HttpClient CreateSignedInClient(string? email = null, string? name = null)
    {
        var client = _factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            // We DO want redirects off so we can assert status codes precisely,
            // but we still need the cookie container so the auth cookie set by
            // /api/test/signin gets carried to subsequent requests.
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        var signinReq = new TestAuthEndpoints.TestSignInRequest(email, name);
        var resp = client.PostAsJsonAsync("/api/test/signin", signinReq).GetAwaiter().GetResult();
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        return client;
    }

    [Fact]
    public async Task Me_returns_user_after_test_signin()
    {
        var client = CreateSignedInClient("alice@example.com", "Alice Example");
        var resp = await client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<MePayload>();
        Assert.NotNull(body);
        Assert.True(body!.IsAuthenticated);
        Assert.Equal("Alice Example", body.Name);
        Assert.Equal("alice@example.com", body.Email);
    }

    [Fact]
    public async Task Contest_post_records_click_and_returns_april_fools_message()
    {
        var client = CreateSignedInClient();
        var resp = await client.PostAsync("/api/contest", content: null);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<ContestPayload>();
        Assert.NotNull(body);
        Assert.True(body!.Success);
        Assert.Contains("April Fools", body.Message, StringComparison.OrdinalIgnoreCase);
        Assert.NotEqual(default, body.RecordedAt);
    }

    [Fact]
    public async Task Contest_count_increments_after_post()
    {
        var client = CreateSignedInClient();

        var before = await client.GetFromJsonAsync<CountPayload>("/api/contest/count");
        Assert.NotNull(before);

        var post = await client.PostAsync("/api/contest", content: null);
        Assert.Equal(HttpStatusCode.OK, post.StatusCode);

        var after = await client.GetFromJsonAsync<CountPayload>("/api/contest/count");
        Assert.NotNull(after);
        Assert.True(after!.Count > before!.Count,
            $"count should increase after POST; before={before.Count} after={after.Count}");
    }

    [Fact]
    public async Task Chat_post_returns_reply_for_signed_in_user()
    {
        var client = CreateSignedInClient();
        var payload = new { History = Array.Empty<object>(), Message = "hello" };
        var resp = await client.PostAsJsonAsync("/api/chat", payload);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var body = await resp.Content.ReadFromJsonAsync<ChatPayload>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.Reply));
        Assert.Contains("stub", body.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Signout_clears_session()
    {
        var client = CreateSignedInClient();

        var ok = await client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        var signout = await client.PostAsync("/api/test/signout", content: null);
        Assert.Equal(HttpStatusCode.OK, signout.StatusCode);

        var after = await client.GetAsync("/api/me");
        Assert.Equal(HttpStatusCode.Unauthorized, after.StatusCode);
    }

    private sealed record MePayload(bool IsAuthenticated, string? Name, string? Email, string? Provider);
    private sealed record ContestPayload(bool Success, string Message, DateTime RecordedAt);
    private sealed record CountPayload(int Count);
    private sealed record ChatPayload(string Reply);
}

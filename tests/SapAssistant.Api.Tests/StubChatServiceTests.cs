using SapAssistant.Api.Chat;

namespace SapAssistant.Api.Tests;

public class StubChatServiceTests
{
    private readonly StubChatService _svc = new();

    [Fact]
    public async Task Empty_message_returns_prompt_to_speak()
    {
        var resp = await _svc.SendAsync(new ChatRequest([], "   "));
        Assert.Contains("Say something", resp.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("hello")]
    [InlineData("Hi there")]
    [InlineData("HELLO friend")]
    public async Task Greeting_messages_return_stub_greeting(string message)
    {
        var resp = await _svc.SendAsync(new ChatRequest([], message));
        Assert.Contains("stub", resp.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("What about SAP?")]
    [InlineData("sap NCo timeline?")]
    public async Task Sap_messages_mention_sap(string message)
    {
        var resp = await _svc.SendAsync(new ChatRequest([], message));
        Assert.Contains("SAP", resp.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Contest_messages_mention_april_fools()
    {
        var resp = await _svc.SendAsync(new ChatRequest([], "Tell me about the contest"));
        Assert.Contains("April Fools", resp.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Help_messages_list_capabilities()
    {
        var resp = await _svc.SendAsync(new ChatRequest([], "help"));
        Assert.Contains("pretend", resp.Reply, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Default_returns_a_non_empty_reply()
    {
        // Generic chitchat falls into the random default-replies pool.
        var resp = await _svc.SendAsync(new ChatRequest([], "what is the capital of France?"));
        Assert.False(string.IsNullOrWhiteSpace(resp.Reply));
    }
}

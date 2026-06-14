namespace SapAssistant.Api.Chat;

public sealed class StubChatService : IChatService
{
    private static readonly string[] DefaultReplies =
    [
        "I'm a stubbed assistant for now — once we connect Azure OpenAI I'll answer for real.",
        "Great question! In a future release I'll have real SAP context to answer that.",
        "Got it. I'm currently a placeholder, but I'm noting your message for the real version.",
        "Once the chatbot upgrade ships I'll be able to give you useful answers here.",
    ];

    public Task<ChatResponse> SendAsync(ChatRequest request, CancellationToken ct = default)
    {
        var msg = request.Message?.Trim() ?? string.Empty;

        if (string.IsNullOrEmpty(msg))
        {
            return Task.FromResult(new ChatResponse("Say something and I'll do my best to pretend I understand."));
        }

        if (msg.Contains("hello", StringComparison.OrdinalIgnoreCase) ||
            msg.Contains("hi", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ChatResponse("Hi! I'm the sap-assistant stub. Ask me anything — I'll improvise."));
        }

        if (msg.Contains("sap", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ChatResponse(
                "SAP integration is planned: once the SAP NCo client is wired in, I'll answer real questions about your S/4HANA data."));
        }

        if (msg.Contains("contest", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ChatResponse(
                "Ah, the contest. Spoiler: it's an April Fools joke. But your click does get recorded — head to the contest page!"));
        }

        if (msg.Contains("help", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(new ChatResponse(
                "Things I can pretend to do right now: chit-chat, talk about SAP, talk about the contest. Coming soon: actual answers."));
        }

        var reply = DefaultReplies[Random.Shared.Next(DefaultReplies.Length)];
        return Task.FromResult(new ChatResponse(reply));
    }
}

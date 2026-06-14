namespace SapAssistant.Api.Chat;

public sealed record ChatMessage(string Role, string Content);

public sealed record ChatRequest(IReadOnlyList<ChatMessage> History, string Message);

public sealed record ChatResponse(string Reply);

public interface IChatService
{
    Task<ChatResponse> SendAsync(ChatRequest request, CancellationToken ct = default);
}

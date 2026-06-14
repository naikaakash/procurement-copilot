using SapAssistant.Api.Chat;

namespace SapAssistant.Api.Endpoints;

public static class ChatEndpoints
{
    public static IEndpointRouteBuilder MapChatEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/chat").RequireAuthorization();

        group.MapPost("/", async (IChatService chat, ChatRequest req, CancellationToken ct) =>
        {
            var resp = await chat.SendAsync(req, ct);
            return Results.Ok(resp);
        }).WithName("ChatSend");

        return app;
    }
}

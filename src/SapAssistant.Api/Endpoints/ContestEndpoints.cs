using System.Security.Claims;
using SapAssistant.Api.Storage;

namespace SapAssistant.Api.Endpoints;

public static class ContestEndpoints
{
    private const string AprilFoolsMessage =
        "\ud83c\udf89 April Fools! There is no contest. But your click was lovingly recorded for posterity.";

    public static IEndpointRouteBuilder MapContestEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/contest").RequireAuthorization();

        group.MapPost("/", async (IContestRepository repo, ClaimsPrincipal user, CancellationToken ct) =>
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? user.FindFirstValue("sub")
                         ?? "anonymous";
            var displayName = user.FindFirstValue("name") ?? user.Identity?.Name;
            var email = user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Email);

            var entry = new ContestEntry(userId, displayName, email, DateTime.UtcNow);
            var stored = await repo.RecordClickAsync(entry, ct);

            return Results.Ok(new
            {
                success = true,
                message = AprilFoolsMessage,
                recordedAt = stored.ClickedAtUtc,
            });
        }).WithName("EnterContest");

        group.MapGet("/count", async (IContestRepository repo, CancellationToken ct) =>
            Results.Ok(new { count = await repo.CountAsync(ct) })).WithName("ContestCount");

        return app;
    }
}

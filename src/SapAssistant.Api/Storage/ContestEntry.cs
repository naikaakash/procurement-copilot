namespace SapAssistant.Api.Storage;

public sealed record ContestEntry(
    string UserId,
    string? DisplayName,
    string? Email,
    DateTime ClickedAtUtc);

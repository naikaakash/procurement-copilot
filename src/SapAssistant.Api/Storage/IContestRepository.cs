namespace SapAssistant.Api.Storage;

/// <summary>
/// Where contest "click" entries get persisted.
/// MVP impl is in-memory; Phase 4 swaps in Excel-in-Blob.
/// </summary>
public interface IContestRepository
{
    Task<ContestEntry> RecordClickAsync(ContestEntry entry, CancellationToken ct = default);

    Task<IReadOnlyList<ContestEntry>> ListAsync(CancellationToken ct = default);

    Task<int> CountAsync(CancellationToken ct = default);
}

using System.Collections.Concurrent;

namespace SapAssistant.Api.Storage;

public sealed class InMemoryContestRepository : IContestRepository
{
    private readonly ConcurrentBag<ContestEntry> _entries = [];

    public Task<ContestEntry> RecordClickAsync(ContestEntry entry, CancellationToken ct = default)
    {
        _entries.Add(entry);
        return Task.FromResult(entry);
    }

    public Task<IReadOnlyList<ContestEntry>> ListAsync(CancellationToken ct = default)
        => Task.FromResult<IReadOnlyList<ContestEntry>>([.. _entries]);

    public Task<int> CountAsync(CancellationToken ct = default)
        => Task.FromResult(_entries.Count);
}

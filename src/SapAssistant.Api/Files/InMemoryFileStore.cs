using System.Collections.Concurrent;

namespace SapAssistant.Api.Files;

/// <summary>
/// In-memory implementation used by xUnit tests + the Aspire run-locally story.
/// Survives only as long as the process. Safe for concurrent use.
/// </summary>
public sealed class InMemoryFileStore : IFileStore
{
    private readonly ConcurrentDictionary<(string UserId, Guid Id), (FileMetadata Meta, byte[] Bytes)> _files = new();

    public Task<FileMetadata> SaveAsync(
        string userId,
        string fileName,
        string contentType,
        Stream content,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        using var ms = new MemoryStream();
        content.CopyTo(ms);
        var bytes = ms.ToArray();

        var meta = new FileMetadata(
            Id: Guid.NewGuid(),
            UserId: userId.ToLowerInvariant(),
            FileName: fileName,
            ContentType: contentType,
            SizeBytes: bytes.LongLength,
            UploadedAtUtc: DateTime.UtcNow);

        _files[(meta.UserId, meta.Id)] = (meta, bytes);
        return Task.FromResult(meta);
    }

    public Task<IReadOnlyList<FileMetadata>> ListAsync(string userId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        IReadOnlyList<FileMetadata> list = _files
            .Where(kv => kv.Key.UserId == owner)
            .Select(kv => kv.Value.Meta)
            .OrderByDescending(m => m.UploadedAtUtc)
            .ToList();
        return Task.FromResult(list);
    }

    public Task<FileMetadata?> GetAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        return Task.FromResult(_files.TryGetValue((owner, fileId), out var hit) ? hit.Meta : null);
    }

    public Task<Stream?> OpenReadAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        if (!_files.TryGetValue((owner, fileId), out var hit))
        {
            return Task.FromResult<Stream?>(null);
        }
        return Task.FromResult<Stream?>(new MemoryStream(hit.Bytes, writable: false));
    }

    public Task<bool> DeleteAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        return Task.FromResult(_files.TryRemove((owner, fileId), out _));
    }
}

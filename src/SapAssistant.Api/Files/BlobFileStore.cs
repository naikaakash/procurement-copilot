using System.Globalization;
using Azure;
using Azure.Core;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SapAssistant.Api.Files;

/// <summary>
/// Production <see cref="IFileStore"/> backed by Azure Blob Storage. Uses
/// DefaultAzureCredential (UAMI in Container Apps, az-login locally).
///
/// Layout:
///   container "uploads" / users/{userIdLower}/{fileId}.bin
///
/// Original filename, content-type and uploaded-at live in blob metadata so we
/// don't need a separate database.
///
/// Per-user isolation is enforced in code (every API takes a userId and we
/// only ever look inside that user's prefix).
/// </summary>
public sealed class BlobFileStore : IFileStore
{
    private const string MetaFileName     = "filename";
    private const string MetaContentType  = "contenttype";
    private const string MetaUploadedAt   = "uploadedatutc";
    private const string MetaUserId       = "userid";

    private readonly BlobContainerClient _container;
    private readonly ILogger<BlobFileStore> _log;

    public BlobFileStore(
        IOptions<FileStoreOptions> options,
        TokenCredential credential,
        ILogger<BlobFileStore> log)
    {
        var opts = options.Value;
        if (string.IsNullOrWhiteSpace(opts.AccountName))
        {
            throw new InvalidOperationException("Storage:AccountName must be configured for BlobFileStore.");
        }

        var serviceUri = new Uri($"https://{opts.AccountName}.blob.core.windows.net");
        var service    = new BlobServiceClient(serviceUri, credential);
        _container     = service.GetBlobContainerClient(opts.ContainerName);
        _log           = log;
    }

    public async Task<FileMetadata> SaveAsync(
        string userId,
        string fileName,
        string contentType,
        Stream content,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);

        var owner = userId.ToLowerInvariant();
        var id    = Guid.NewGuid();
        var uploadedAt = DateTime.UtcNow;

        var blob = _container.GetBlobClient(BlobName(owner, id));

        var headers = new BlobHttpHeaders { ContentType = contentType };
        var metadata = new Dictionary<string, string>
        {
            [MetaFileName]    = fileName,
            [MetaContentType] = contentType,
            [MetaUploadedAt]  = uploadedAt.ToString("O", CultureInfo.InvariantCulture),
            [MetaUserId]      = owner,
        };

        var response = await blob.UploadAsync(
            content,
            new BlobUploadOptions { HttpHeaders = headers, Metadata = metadata },
            cancellationToken: ct);

        var props = await blob.GetPropertiesAsync(cancellationToken: ct);
        _log.LogInformation("Stored upload {FileId} for {UserId} ({Bytes} bytes)", id, owner, props.Value.ContentLength);

        return new FileMetadata(
            Id: id,
            UserId: owner,
            FileName: fileName,
            ContentType: contentType,
            SizeBytes: props.Value.ContentLength,
            UploadedAtUtc: uploadedAt);
    }

    public async Task<IReadOnlyList<FileMetadata>> ListAsync(string userId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        var prefix = UserPrefix(owner);

        var results = new List<FileMetadata>();
        await foreach (var item in _container.GetBlobsAsync(BlobTraits.Metadata, prefix: prefix, cancellationToken: ct))
        {
            if (TryToMetadata(item, owner, out var meta))
            {
                results.Add(meta);
            }
        }

        return results
            .OrderByDescending(m => m.UploadedAtUtc)
            .ToList();
    }

    public async Task<FileMetadata?> GetAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        var blob  = _container.GetBlobClient(BlobName(owner, fileId));

        try
        {
            var props = await blob.GetPropertiesAsync(cancellationToken: ct);
            return ToMetadata(props.Value, owner, fileId);
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task<Stream?> OpenReadAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        var blob  = _container.GetBlobClient(BlobName(owner, fileId));

        try
        {
            var download = await blob.OpenReadAsync(cancellationToken: ct);
            return download;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string userId, Guid fileId, CancellationToken ct = default)
    {
        var owner = userId.ToLowerInvariant();
        var blob  = _container.GetBlobClient(BlobName(owner, fileId));
        var resp  = await blob.DeleteIfExistsAsync(cancellationToken: ct);
        if (resp.Value)
        {
            _log.LogInformation("Deleted upload {FileId} for {UserId}", fileId, owner);
        }
        return resp.Value;
    }

    private static string UserPrefix(string owner) => $"users/{owner}/";
    private static string BlobName(string owner, Guid id) => $"{UserPrefix(owner)}{id:N}.bin";

    private static bool TryToMetadata(BlobItem item, string owner, out FileMetadata meta)
    {
        var name = item.Name;
        // Strip the prefix and the .bin suffix to recover the Guid.
        var prefix = UserPrefix(owner);
        if (!name.StartsWith(prefix, StringComparison.Ordinal) || !name.EndsWith(".bin", StringComparison.Ordinal))
        {
            meta = null!;
            return false;
        }

        var idText = name.Substring(prefix.Length, name.Length - prefix.Length - ".bin".Length);
        if (!Guid.TryParseExact(idText, "N", out var id))
        {
            meta = null!;
            return false;
        }

        meta = ToMetadata(item.Properties.ContentLength ?? 0, item.Metadata, owner, id);
        return true;
    }

    private static FileMetadata ToMetadata(BlobProperties props, string owner, Guid id) =>
        ToMetadata(props.ContentLength, props.Metadata, owner, id);

    private static FileMetadata ToMetadata(long contentLength, IDictionary<string, string> metadata, string owner, Guid id)
    {
        var fileName    = metadata.TryGetValue(MetaFileName, out var fn)    ? fn : id.ToString("N");
        var contentType = metadata.TryGetValue(MetaContentType, out var ct) ? ct : "application/octet-stream";
        var uploadedAt  = metadata.TryGetValue(MetaUploadedAt, out var ts) && DateTime.TryParse(ts, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed)
            ? parsed
            : DateTime.UtcNow;

        return new FileMetadata(
            Id: id,
            UserId: owner,
            FileName: fileName,
            ContentType: contentType,
            SizeBytes: contentLength,
            UploadedAtUtc: uploadedAt);
    }
}

/// <summary>Strongly-typed options bound from the <c>Storage</c> config section.</summary>
public sealed class FileStoreOptions
{
    public string? AccountName { get; set; }
    public string ContainerName { get; set; } = "uploads";
    public bool UseInMemory { get; set; }
}

namespace SapAssistant.Api.Files;

/// <summary>
/// Per-user file storage abstraction. Implementations MUST enforce that the
/// supplied <c>userId</c> can never read, list, download or delete another
/// user's files — this is the security boundary for uploads.
/// </summary>
public interface IFileStore
{
    /// <summary>
    /// Persist a new upload and return its metadata. Caller is responsible for
    /// content-type and size validation BEFORE calling.
    /// </summary>
    Task<FileMetadata> SaveAsync(
        string userId,
        string fileName,
        string contentType,
        Stream content,
        CancellationToken ct = default);

    /// <summary>List metadata for every file owned by <paramref name="userId"/>, newest first.</summary>
    Task<IReadOnlyList<FileMetadata>> ListAsync(string userId, CancellationToken ct = default);

    /// <summary>Get one file's metadata, or null if it doesn't exist OR doesn't belong to the user.</summary>
    Task<FileMetadata?> GetAsync(string userId, Guid fileId, CancellationToken ct = default);

    /// <summary>
    /// Open the file's bytes for reading. Caller must dispose. Returns null if not found / not owned.
    /// </summary>
    Task<Stream?> OpenReadAsync(string userId, Guid fileId, CancellationToken ct = default);

    /// <summary>Delete the file. Returns false if not found / not owned.</summary>
    Task<bool> DeleteAsync(string userId, Guid fileId, CancellationToken ct = default);
}

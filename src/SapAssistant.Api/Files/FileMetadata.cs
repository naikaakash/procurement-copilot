namespace SapAssistant.Api.Files;

/// <summary>
/// Metadata about a single user-uploaded Excel file.
/// Lives in blob metadata in prod; in a dictionary value in tests.
/// </summary>
/// <param name="Id">Server-assigned GUID. The blob name on disk uses this.</param>
/// <param name="UserId">Owner of the file; isolation boundary. Always lowercased.</param>
/// <param name="FileName">Original file name as the user uploaded it.</param>
/// <param name="ContentType">MIME type, e.g. application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.</param>
/// <param name="SizeBytes">Size on disk in bytes.</param>
/// <param name="UploadedAtUtc">When the upload completed.</param>
public sealed record FileMetadata(
    Guid Id,
    string UserId,
    string FileName,
    string ContentType,
    long SizeBytes,
    DateTime UploadedAtUtc);

using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using SapAssistant.Api.Files;

namespace SapAssistant.Api.Endpoints;

/// <summary>
/// CRUD for per-user Excel uploads. Auth-gated; every request resolves the
/// owning user from claims and never trusts a client-supplied user id.
///
/// Endpoints:
///   POST   /api/files                — multipart, validates .xlsx + 10 MB cap, returns metadata
///   GET    /api/files                — list current user's files (newest first)
///   GET    /api/files/{id}/download  — stream the bytes back with the original filename
///   DELETE /api/files/{id}           — remove
/// </summary>
public static class FilesEndpoints
{
    /// <summary>Hard cap on upload size; mirrored in Kestrel + FormOptions.</summary>
    public const long MaxUploadBytes = 10L * 1024 * 1024; // 10 MB

    public const string XlsxContentType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static IEndpointRouteBuilder MapFilesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/files")
                       .RequireAuthorization()
                       .DisableAntiforgery();

        group.MapPost("/", UploadAsync)
             .WithName("UploadFile")
             .Accepts<IFormFile>("multipart/form-data");

        group.MapGet("/", ListAsync).WithName("ListFiles");
        group.MapGet("/{id:guid}/download", DownloadAsync).WithName("DownloadFile");
        group.MapDelete("/{id:guid}", DeleteAsync).WithName("DeleteFile");

        return app;
    }

    private static async Task<Results<Ok<FileInfoDto>, BadRequest<ProblemDetails>, UnauthorizedHttpResult>> UploadAsync(
        HttpRequest request,
        ClaimsPrincipal user,
        IFileStore store,
        ILoggerFactory loggerFactory,
        CancellationToken ct)
    {
        var log = loggerFactory.CreateLogger("FilesEndpoints.Upload");
        var userId = ResolveUserId(user);
        if (userId is null) return TypedResults.Unauthorized();

        if (!request.HasFormContentType)
        {
            return Problem("Request must be multipart/form-data with a 'file' field.");
        }

        IFormFile? file;
        try
        {
            var form = await request.ReadFormAsync(ct);
            file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
        }
        catch (BadHttpRequestException ex)
        {
            log.LogWarning(ex, "Multipart parse failed for user {UserId}", userId);
            return Problem(ex.Message);
        }

        if (file is null || file.Length == 0)
        {
            return Problem("No file uploaded. Use a multipart field named 'file'.");
        }

        if (file.Length > MaxUploadBytes)
        {
            return Problem($"File exceeds the {MaxUploadBytes / (1024 * 1024)} MB limit.");
        }

        var name = file.FileName ?? "upload.xlsx";
        if (!name.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return Problem("Only .xlsx files are accepted.");
        }

        // Spot-check the magic bytes: every .xlsx is a ZIP, so first 4 bytes
        // must be 50 4B 03 04 ("PK\x03\x04"). This blocks renamed text files
        // before we ship the bytes to blob.
        await using (var probe = file.OpenReadStream())
        {
            var header = new byte[4];
            var read = await probe.ReadAsync(header.AsMemory(0, 4), ct);
            if (read < 4 || header[0] != 0x50 || header[1] != 0x4B || header[2] != 0x03 || header[3] != 0x04)
            {
                return Problem("File is not a valid .xlsx (Excel 2007+).");
            }
        }

        await using var stream = file.OpenReadStream();
        var contentType = string.IsNullOrWhiteSpace(file.ContentType) ? XlsxContentType : file.ContentType;
        var meta = await store.SaveAsync(userId, name, contentType, stream, ct);

        log.LogInformation("User {UserId} uploaded {FileName} as {FileId} ({Bytes} bytes)",
            userId, meta.FileName, meta.Id, meta.SizeBytes);

        return TypedResults.Ok(FileInfoDto.FromMetadata(meta));
    }

    private static async Task<Results<Ok<IReadOnlyList<FileInfoDto>>, UnauthorizedHttpResult>> ListAsync(
        ClaimsPrincipal user,
        IFileStore store,
        CancellationToken ct)
    {
        var userId = ResolveUserId(user);
        if (userId is null) return TypedResults.Unauthorized();

        var list = await store.ListAsync(userId, ct);
        IReadOnlyList<FileInfoDto> dto = list.Select(FileInfoDto.FromMetadata).ToList();
        return TypedResults.Ok(dto);
    }

    private static async Task<IResult> DownloadAsync(
        Guid id,
        ClaimsPrincipal user,
        IFileStore store,
        CancellationToken ct)
    {
        var userId = ResolveUserId(user);
        if (userId is null) return TypedResults.Unauthorized();

        var meta = await store.GetAsync(userId, id, ct);
        if (meta is null) return TypedResults.NotFound();

        var stream = await store.OpenReadAsync(userId, id, ct);
        if (stream is null) return TypedResults.NotFound();

        // RFC 5987 filename* so non-ASCII names survive intermediaries.
        var cd = new ContentDispositionHeaderValue("attachment");
        cd.SetHttpFileName(meta.FileName);

        return Results.File(
            fileStream: stream,
            contentType: string.IsNullOrWhiteSpace(meta.ContentType) ? XlsxContentType : meta.ContentType,
            fileDownloadName: meta.FileName);
    }

    private static async Task<Results<NoContent, NotFound, UnauthorizedHttpResult>> DeleteAsync(
        Guid id,
        ClaimsPrincipal user,
        IFileStore store,
        CancellationToken ct)
    {
        var userId = ResolveUserId(user);
        if (userId is null) return TypedResults.Unauthorized();

        var removed = await store.DeleteAsync(userId, id, ct);
        return removed ? TypedResults.NoContent() : TypedResults.NotFound();
    }

    internal static string? ResolveUserId(ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true) return null;

        // Microsoft Entra puts the immutable user object id in NameIdentifier
        // (and in the "oid"/"sub" claims). Lowercase + trim for consistent
        // blob prefixes.
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("oid")
                  ?? user.FindFirstValue("sub");
        return string.IsNullOrWhiteSpace(raw) ? null : raw.Trim().ToLowerInvariant();
    }

    private static BadRequest<ProblemDetails> Problem(string detail) =>
        TypedResults.BadRequest(new ProblemDetails
        {
            Title = "Invalid upload",
            Detail = detail,
            Status = StatusCodes.Status400BadRequest,
        });
}

/// <summary>Shape returned to the SPA. Excludes the userId.</summary>
public sealed record FileInfoDto(
    Guid Id,
    string FileName,
    string ContentType,
    long SizeBytes,
    DateTime UploadedAtUtc)
{
    public static FileInfoDto FromMetadata(FileMetadata m) =>
        new(m.Id, m.FileName, m.ContentType, m.SizeBytes, m.UploadedAtUtc);
}

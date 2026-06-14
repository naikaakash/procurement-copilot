using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SapAssistant.Api.Endpoints;
using SapAssistant.Api.Files;

namespace SapAssistant.Api.Tests;

/// <summary>
/// End-to-end tests for /api/files. Auth is faked via /api/test/signin so we
/// can vary the email (and therefore the NameIdentifier "test|{email}") to
/// prove per-user isolation.
/// </summary>
public class FilesEndpointsTests(SapAssistantFactory factory)
    : IClassFixture<SapAssistantFactory>
{
    private readonly SapAssistantFactory _factory = factory;

    // The smallest input that satisfies the magic-byte check: ZIP local file header
    // signature 50 4B 03 04 followed by some bytes. NOT a parseable Excel file,
    // but Phase 4 only validates the signature; parsing comes in Phase 6.
    private static readonly byte[] FakeXlsxBytes =
    {
        0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00,
    };

    private HttpClient CreateSignedInClient(string email = "alice@example.com", string name = "Alice")
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            HandleCookies = true,
        });
        var resp = client.PostAsJsonAsync("/api/test/signin",
            new TestAuthEndpoints.TestSignInRequest(email, name)).GetAwaiter().GetResult();
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        return client;
    }

    private static MultipartFormDataContent MakeUpload(
        byte[] bytes,
        string fileName = "sap-export.xlsx",
        string contentType = FilesEndpoints.XlsxContentType)
    {
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);
        content.Add(file, "file", fileName);
        return content;
    }

    [Fact]
    public async Task List_returns_401_when_unauthenticated()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var resp = await client.GetAsync("/api/files");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Upload_returns_401_when_unauthenticated()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var resp = await client.PostAsync("/api/files", MakeUpload(FakeXlsxBytes));
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Upload_then_list_returns_the_file()
    {
        var client = CreateSignedInClient("alice@example.com");

        var upload = await client.PostAsync("/api/files", MakeUpload(FakeXlsxBytes, "Q1-orders.xlsx"));
        Assert.Equal(HttpStatusCode.OK, upload.StatusCode);

        var info = await upload.Content.ReadFromJsonAsync<FileInfoDto>();
        Assert.NotNull(info);
        Assert.Equal("Q1-orders.xlsx", info!.FileName);
        Assert.Equal(FakeXlsxBytes.LongLength, info.SizeBytes);
        Assert.NotEqual(Guid.Empty, info.Id);

        var list = await client.GetFromJsonAsync<List<FileInfoDto>>("/api/files");
        Assert.NotNull(list);
        Assert.Contains(list!, f => f.Id == info.Id && f.FileName == "Q1-orders.xlsx");
    }

    [Fact]
    public async Task Upload_rejects_wrong_extension()
    {
        var client = CreateSignedInClient();
        var resp = await client.PostAsync("/api/files",
            MakeUpload(FakeXlsxBytes, "evil.txt", "text/plain"));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Upload_rejects_invalid_magic_bytes()
    {
        var client = CreateSignedInClient();
        var notZip = "Hello, world! Definitely not an xlsx."u8.ToArray();
        var resp = await client.PostAsync("/api/files", MakeUpload(notZip, "fake.xlsx"));
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Upload_rejects_missing_file_field()
    {
        var client = CreateSignedInClient();
        var empty = new MultipartFormDataContent
        {
            { new StringContent("not a file"), "other", "blob" },
        };
        var resp = await client.PostAsync("/api/files", empty);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Download_streams_back_original_bytes_and_filename()
    {
        var client = CreateSignedInClient();
        var upload = await client.PostAsync("/api/files", MakeUpload(FakeXlsxBytes, "report.xlsx"));
        var info = await upload.Content.ReadFromJsonAsync<FileInfoDto>();

        var resp = await client.GetAsync($"/api/files/{info!.Id}/download");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var bytes = await resp.Content.ReadAsByteArrayAsync();
        Assert.Equal(FakeXlsxBytes, bytes);

        Assert.NotNull(resp.Content.Headers.ContentDisposition);
        Assert.Equal("report.xlsx", resp.Content.Headers.ContentDisposition!.FileNameStar
            ?? resp.Content.Headers.ContentDisposition.FileName?.Trim('"'));
    }

    [Fact]
    public async Task Delete_removes_file()
    {
        var client = CreateSignedInClient();
        var upload = await client.PostAsync("/api/files", MakeUpload(FakeXlsxBytes));
        var info = await upload.Content.ReadFromJsonAsync<FileInfoDto>();

        var del = await client.DeleteAsync($"/api/files/{info!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var get = await client.GetAsync($"/api/files/{info.Id}/download");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task User_cannot_list_other_users_files()
    {
        // Alice uploads
        var alice = CreateSignedInClient("alice@example.com", "Alice");
        var aliceUpload = await alice.PostAsync("/api/files", MakeUpload(FakeXlsxBytes, "alice-secret.xlsx"));
        var aliceInfo = await aliceUpload.Content.ReadFromJsonAsync<FileInfoDto>();
        Assert.NotNull(aliceInfo);

        // Bob signs in fresh — separate cookie container
        var bob = CreateSignedInClient("bob@example.com", "Bob");
        var bobList = await bob.GetFromJsonAsync<List<FileInfoDto>>("/api/files");
        Assert.NotNull(bobList);
        Assert.DoesNotContain(bobList!, f => f.Id == aliceInfo!.Id);
    }

    [Fact]
    public async Task User_cannot_download_other_users_file()
    {
        var alice = CreateSignedInClient("alice@example.com", "Alice");
        var aliceUpload = await alice.PostAsync("/api/files", MakeUpload(FakeXlsxBytes));
        var aliceInfo = await aliceUpload.Content.ReadFromJsonAsync<FileInfoDto>();

        var bob = CreateSignedInClient("bob@example.com", "Bob");
        var attempt = await bob.GetAsync($"/api/files/{aliceInfo!.Id}/download");
        Assert.Equal(HttpStatusCode.NotFound, attempt.StatusCode);
    }

    [Fact]
    public async Task User_cannot_delete_other_users_file()
    {
        var alice = CreateSignedInClient("alice@example.com", "Alice");
        var aliceUpload = await alice.PostAsync("/api/files", MakeUpload(FakeXlsxBytes));
        var aliceInfo = await aliceUpload.Content.ReadFromJsonAsync<FileInfoDto>();

        var bob = CreateSignedInClient("bob@example.com", "Bob");
        var attempt = await bob.DeleteAsync($"/api/files/{aliceInfo!.Id}");
        Assert.Equal(HttpStatusCode.NotFound, attempt.StatusCode);

        // Alice can still see her file.
        var aliceList = await alice.GetFromJsonAsync<List<FileInfoDto>>("/api/files");
        Assert.Contains(aliceList!, f => f.Id == aliceInfo.Id);
    }
}

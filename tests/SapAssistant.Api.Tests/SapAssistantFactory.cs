using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace SapAssistant.Api.Tests;

/// <summary>
/// Spins up the API in test mode: disables auth (no Key Vault required)
/// so we can assert endpoint shapes without OAuth round-trips.
/// </summary>
public sealed class SapAssistantFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Auth:Disable"] = "true",
                ["KeyVault:Name"] = "",
                ["FrontendBaseUrl"] = "http://localhost:5173",
            });
        });
    }
}

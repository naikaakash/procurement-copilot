using Azure.Identity;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Identity.Web;

namespace SapAssistant.Api.Auth;

/// <summary>
/// Wires up Azure Key Vault → Microsoft Entra OIDC → cookie sessions.
///
/// Local dev: uses your `az login` credentials to read secrets from Key Vault.
/// Prod (Container Apps): uses the system-assigned managed identity.
/// Tests: skipped entirely if KeyVault:Name is not configured.
/// </summary>
public static class AuthConfig
{
    public static IServiceCollection AddSapAuth(this IServiceCollection services, IConfigurationManager configuration, IHostEnvironment env)
    {
        var keyVaultName = configuration["KeyVault:Name"];
        var disableAuth = configuration.GetValue<bool>("Auth:Disable")
                           || env.EnvironmentName == "Testing";

        if (disableAuth || string.IsNullOrWhiteSpace(keyVaultName))
        {
            services
                .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(o => ConfigureCookie(o, env));
            services.AddAuthorization();
            return services;
        }

        configuration.AddAzureKeyVault(
            new Uri($"https://{keyVaultName}.vault.azure.net/"),
            new DefaultAzureCredential());

        var azureAdSettings = new Dictionary<string, string?>
        {
            ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
            ["AzureAd:TenantId"] = configuration["OAuth-Microsoft-TenantId"] ?? "common",
            ["AzureAd:ClientId"] = configuration["OAuth-Microsoft-ClientId"],
            ["AzureAd:ClientSecret"] = configuration["OAuth-Microsoft-ClientSecret"],
            ["AzureAd:CallbackPath"] = "/signin-oidc",
            ["AzureAd:SignedOutCallbackPath"] = "/signout-callback-oidc",
        };
        configuration.AddInMemoryCollection(azureAdSettings);

        services
            .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApp(configuration.GetSection("AzureAd"));

        // Microsoft.Identity.Web wires the plain "Cookies" scheme — configure THAT, not the
        // ASP.NET Identity application cookie. Use Configure<TOptions>(scheme, ...) so it
        // overrides anything M.I.W. set.
        services.Configure<CookieAuthenticationOptions>(
            CookieAuthenticationDefaults.AuthenticationScheme,
            o => ConfigureCookie(o, env));

        services.AddAuthorization();
        return services;
    }

    private static void ConfigureCookie(Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationOptions o, IHostEnvironment env)
    {
        o.Cookie.Name = "sap-assistant-auth";
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.Cookie.SecurePolicy = env.IsDevelopment() || env.EnvironmentName == "Testing"
            ? CookieSecurePolicy.SameAsRequest
            : CookieSecurePolicy.Always;
        o.SlidingExpiration = true;
        o.ExpireTimeSpan = TimeSpan.FromDays(14);
        o.Events.OnRedirectToLogin = ctx =>
        {
            if (ctx.Request.Path.StartsWithSegments("/api"))
            {
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }
            ctx.Response.Redirect(ctx.RedirectUri);
            return Task.CompletedTask;
        };
    }
}

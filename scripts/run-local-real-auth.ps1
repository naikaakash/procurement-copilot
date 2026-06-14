# scripts/run-local-real-auth.ps1
#
# Runs SapAssistant.Api locally with the REAL Microsoft Entra OIDC flow against
# https://localhost:5001 - same single-origin setup as production
# (SPA served from wwwroot, no Vite, no cross-origin). Use this to debug
# sign-in issues end-to-end without deploying.
#
# Prerequisites (one-time):
#   1. `az login` as a user with read access to Key Vault sapassistantkv01
#      (the API reads OAuth-Microsoft-ClientId / ClientSecret / TenantId from there).
#   2. Localhost redirect URIs are already registered in the Entra app:
#        http://localhost:5000/signin-oidc  (default, no cert friction)
#        https://localhost:5001/signin-oidc (use -Https; requires `dotnet dev-certs https --trust`)
#
# Usage:
#   pwsh ./scripts/run-local-real-auth.ps1            # http on :5000 (default)
#   pwsh ./scripts/run-local-real-auth.ps1 -Https     # https on :5001 (needs trusted dev cert)
#   pwsh ./scripts/run-local-real-auth.ps1 -SkipBuild # skip SPA build (reuse last wwwroot)
#
#   Then open http://localhost:5000 (or https://localhost:5001) in Edge/Chrome and sign in.
#
# Tip: open the browser dev tools (F12) -> Network tab, and check
# "Preserve log" before clicking Sign in. That captures the full redirect
# chain (/signin -> login.microsoftonline.com -> /signin-oidc -> /contest)
# and any flash you see.

[CmdletBinding()]
param(
  [int]$Port = 5000,
  [switch]$Https,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$scheme = if ($Https) { "https" } else { "http" }
if ($Https -and $Port -eq 5000) { $Port = 5001 }

Write-Host "==> Repo root: $repoRoot" -ForegroundColor Cyan
Write-Host "==> Mode: $scheme on port $Port" -ForegroundColor Cyan

# Sanity check az login.
$account = az account show -o json 2>$null | ConvertFrom-Json
if (-not $account) {
  Write-Error "az login required. Run 'az login' and re-run this script."
}
Write-Host "==> az logged in as: $($account.user.name)" -ForegroundColor Cyan

if (-not $SkipBuild) {
  Write-Host "==> Building SPA..." -ForegroundColor Cyan
  Push-Location (Join-Path $repoRoot 'src\SapAssistant.Web')
  try {
    if (-not (Test-Path node_modules)) { npm ci --no-audit --no-fund }
    npm run build
  } finally { Pop-Location }

  Write-Host "==> Copying SPA dist -> API wwwroot..." -ForegroundColor Cyan
  $src = Join-Path $repoRoot 'src\SapAssistant.Web\dist'
  $dst = Join-Path $repoRoot 'src\SapAssistant.Api\wwwroot'
  if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
  New-Item -ItemType Directory -Path $dst | Out-Null
  Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
}

# Make the OIDC callback path land on this exact local URL. With
# FrontendBaseUrl=/, the API after sign-in redirects to '/' which the SPA
# routes to /contest if authenticated.
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "${scheme}://localhost:$Port"
$env:FrontendBaseUrl = "/"

# Verbose auth logging - lets us see "Correlation failed", "Nonce cookie not
# found", "AuthenticationFailed", etc., in the console.
$env:Logging__LogLevel__Microsoft_AspNetCore_Authentication = "Debug"
$env:Logging__LogLevel__Microsoft_Identity_Web = "Debug"

Write-Host "" -ForegroundColor Green
Write-Host "==> Starting API on ${scheme}://localhost:$Port" -ForegroundColor Green
Write-Host "==> Open ${scheme}://localhost:$Port in Edge or Chrome." -ForegroundColor Green
Write-Host "==> Sign-in flow: / -> Sign in -> login.microsoftonline.com -> /signin-oidc -> /contest" -ForegroundColor Green
Write-Host "==> Ctrl+C to stop." -ForegroundColor Green
Write-Host ""

dotnet run --project (Join-Path $repoRoot 'src\SapAssistant.Api\SapAssistant.Api.csproj') --no-launch-profile

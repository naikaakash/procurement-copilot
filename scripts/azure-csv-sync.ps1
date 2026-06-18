<#
.SYNOPSIS
    azure-csv-sync.ps1 — Upload/download procurement CSVs to/from Azure Blob Storage.

.DESCRIPTION
    Parameterized helper to backup, upload, and download the procurement_data_sample
    CSV files to/from an Azure Storage account (Blob or File Share).

    This script does NOT modify Azure SQL tables. It only manages the CSV source files
    used by the app refresh / sync-erp process.

.PARAMETER Action
    Required. One of: Upload | Download | Backup | List

.PARAMETER StorageAccount
    Azure Storage account name. Defaults to env var AZURE_STORAGE_ACCOUNT.

.PARAMETER StorageKey
    Azure Storage account key. Defaults to env var AZURE_STORAGE_KEY.

.PARAMETER Container
    Blob container name. Defaults to env var AZURE_CSV_CONTAINER (fallback: "procurement-csv").

.PARAMETER BlobPrefix
    Optional folder/prefix within the container. Default: "source/" (e.g. source/suppliers.csv).

.PARAMETER LocalPath
    Local folder containing CSV files. Default: procurement_data_sample (relative to script).

.PARAMETER BackupPath
    Local folder for backups. Default: procurement_data_sample_backup\<timestamp>

.PARAMETER DryRun
    If set, print what would be done but do not execute.

.EXAMPLE
    # Upload generated CSVs to Azure
    .\scripts\azure-csv-sync.ps1 -Action Upload

.EXAMPLE
    # Download current Azure CSVs to local folder (for inspection or diff)
    .\scripts\azure-csv-sync.ps1 -Action Download

.EXAMPLE
    # Backup Azure CSVs before overwriting
    .\scripts\azure-csv-sync.ps1 -Action Backup

.EXAMPLE
    # List blobs in the container
    .\scripts\azure-csv-sync.ps1 -Action List

.EXAMPLE
    # Full parameterized call
    .\scripts\azure-csv-sync.ps1 -Action Upload `
        -StorageAccount "myaccount" `
        -StorageKey "mykey==" `
        -Container "procurement-csv" `
        -BlobPrefix "source/"

.NOTES
    Requires: Azure CLI (az) installed and on PATH, OR Az PowerShell module.
    This script prefers az CLI if available, then falls back to Az module.

    If neither is available, it prints setup instructions.

    AZURE CSV LOCATION (to be confirmed):
    ──────────────────────────────────────────────────────────────────────────
    If the app does not yet have a configured Azure CSV location, set these
    environment variables before running, or pass them as parameters:

        $env:AZURE_STORAGE_ACCOUNT = "your-storage-account-name"
        $env:AZURE_STORAGE_KEY     = "your-storage-account-key"
        $env:AZURE_CSV_CONTAINER   = "procurement-csv"

    Resource Group: (set via AZURE_RESOURCE_GROUP env var or -ResourceGroup param)
    Storage Account: (set via AZURE_STORAGE_ACCOUNT env var or -StorageAccount param)
    Container: (set via AZURE_CSV_CONTAINER env var or -Container param)
    Blob Prefix: "source/"   (default, override with -BlobPrefix)
    ──────────────────────────────────────────────────────────────────────────
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Upload', 'Download', 'Backup', 'List')]
    [string] $Action,

    [string] $StorageAccount = $env:AZURE_STORAGE_ACCOUNT,
    [string] $StorageKey     = $env:AZURE_STORAGE_KEY,
    [string] $Container      = $(if ($env:AZURE_CSV_CONTAINER) { $env:AZURE_CSV_CONTAINER } else { 'procurement-csv' }),
    [string] $ResourceGroup  = $env:AZURE_RESOURCE_GROUP,
    [string] $BlobPrefix     = 'source/',
    [string] $LocalPath      = $null,
    [string] $BackupPath     = $null,
    [switch] $DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Resolve paths relative to repo root ──────────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent $scriptDir

if (-not $LocalPath) {
    $LocalPath = Join-Path $repoRoot 'procurement_data_sample'
}

if (-not $BackupPath) {
    $ts         = Get-Date -Format 'yyyyMMdd_HHmmss'
    $BackupPath = Join-Path $repoRoot "procurement_data_sample_backup\$ts"
}

$CsvFiles = @(
    'suppliers.csv', 'supplier_contacts.csv', 'plants.csv', 'company_codes.csv',
    'purchasing_orgs.csv', 'purchasing_groups.csv', 'materials.csv', 'material_plant.csv',
    'source_list.csv', 'purchasing_info_records.csv', 'inventory_stock.csv',
    'purchase_order_headers.csv', 'purchase_order_items.csv', 'po_schedule_lines.csv',
    'supplier_acknowledgements.csv', 'goods_receipts.csv', 'exception_worklist.csv',
    'agent_recommendations.csv', 'communication_logs.csv', 'asn_shipments.csv',
    'quality_inspections.csv', 'ctb_snapshots.csv', 'mrp_elements.csv',
    'production_orders.csv', 'inventory_movements.csv', 'reservations.csv'
)

# ── Tool detection ────────────────────────────────────────────────────────────
$useAzCli = $false
$useAzPS  = $false

try {
    $null = Get-Command az -ErrorAction Stop
    $useAzCli = $true
    Write-Host "✓ Azure CLI detected" -ForegroundColor Cyan
} catch {
    try {
        $null = Get-Command Get-AzStorageBlobContent -ErrorAction Stop
        $useAzPS = $true
        Write-Host "✓ Az PowerShell module detected" -ForegroundColor Cyan
    } catch {
        Write-Error @"
Neither Azure CLI nor Az PowerShell module found.

To install Azure CLI:  https://aka.ms/installazurecli
To install Az module:  Install-Module -Name Az -Scope CurrentUser -AllowClobber

After install, authenticate:
  Azure CLI:  az login
  Az module:  Connect-AzAccount
"@
        exit 1
    }
}

# ── Validate credentials ──────────────────────────────────────────────────────
if (-not $StorageAccount) {
    Write-Error "StorageAccount is required. Set -StorageAccount or `$env:AZURE_STORAGE_ACCOUNT"
    exit 1
}

# ── Helpers ───────────────────────────────────────────────────────────────────
function Get-BlobName([string]$fileName) {
    return "$BlobPrefix$fileName"
}

function Invoke-AzUpload([string]$localFile, [string]$blobName) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Upload: $localFile → $Container/$blobName" -ForegroundColor Yellow
        return
    }
    if ($useAzCli) {
        az storage blob upload `
            --account-name $StorageAccount `
            --account-key  $StorageKey `
            --container-name $Container `
            --name $blobName `
            --file $localFile `
            --overwrite `
            --output none
    } else {
        $ctx = New-AzStorageContext -StorageAccountName $StorageAccount -StorageAccountKey $StorageKey
        Set-AzStorageBlobContent -Context $ctx -Container $Container -Blob $blobName -File $localFile -Force | Out-Null
    }
}

function Invoke-AzDownload([string]$blobName, [string]$localFile) {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Download: $Container/$blobName → $localFile" -ForegroundColor Yellow
        return
    }
    if ($useAzCli) {
        az storage blob download `
            --account-name $StorageAccount `
            --account-key  $StorageKey `
            --container-name $Container `
            --name $blobName `
            --file $localFile `
            --output none
    } else {
        $ctx = New-AzStorageContext -StorageAccountName $StorageAccount -StorageAccountKey $StorageKey
        Get-AzStorageBlobContent -Context $ctx -Container $Container -Blob $blobName -Destination $localFile -Force | Out-Null
    }
}

function Invoke-AzList {
    if ($useAzCli) {
        az storage blob list `
            --account-name $StorageAccount `
            --account-key  $StorageKey `
            --container-name $Container `
            --prefix $BlobPrefix `
            --output table
    } else {
        $ctx = New-AzStorageContext -StorageAccountName $StorageAccount -StorageAccountKey $StorageKey
        Get-AzStorageBlob -Context $ctx -Container $Container -Prefix $BlobPrefix |
            Select-Object Name, Length, LastModified | Format-Table -AutoSize
    }
}

# ── Invariant check ───────────────────────────────────────────────────────────
function Test-SchemaInvariants {
    Write-Host "`n── Schema invariant checks ──────────────────────────────────" -ForegroundColor Cyan
    $ok = $true

    $itemsFile  = Join-Path $LocalPath 'purchase_order_items.csv'
    $schedFile  = Join-Path $LocalPath 'po_schedule_lines.csv'

    if (Test-Path $itemsFile) {
        $header = (Get-Content $itemsFile -TotalCount 1)
        if ($header -match 'confirmation_control_key') {
            Write-Host "  ✓ purchase_order_items.csv has confirmation_control_key" -ForegroundColor Green
        } else {
            Write-Host "  ✗ purchase_order_items.csv MISSING confirmation_control_key!" -ForegroundColor Red
            $ok = $false
        }
    }

    if (Test-Path $schedFile) {
        $header = (Get-Content $schedFile -TotalCount 1)
        if ($header -notmatch 'confirmation_control_key') {
            Write-Host "  ✓ po_schedule_lines.csv does NOT contain confirmation_control_key" -ForegroundColor Green
        } else {
            Write-Host "  ✗ po_schedule_lines.csv contains confirmation_control_key — BLOCKED" -ForegroundColor Red
            $ok = $false
        }
    }

    return $ok
}

# ══════════════════════════════════════════════════════════════════════════════
#  MAIN ACTIONS
# ══════════════════════════════════════════════════════════════════════════════

Write-Host "`n════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " azure-csv-sync.ps1  |  Action: $Action" -ForegroundColor Cyan
Write-Host " Storage Account: $StorageAccount" -ForegroundColor Cyan
Write-Host " Container:       $Container" -ForegroundColor Cyan
Write-Host " Blob Prefix:     $BlobPrefix" -ForegroundColor Cyan
Write-Host " Local Path:      $LocalPath" -ForegroundColor Cyan
if ($DryRun) { Write-Host " [DRY RUN MODE]" -ForegroundColor Yellow }
Write-Host "════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

switch ($Action) {

    'List' {
        Write-Host "Listing blobs in $Container/$BlobPrefix ..." -ForegroundColor Cyan
        Invoke-AzList
    }

    'Backup' {
        Write-Host "Backing up Azure blobs to $BackupPath ..." -ForegroundColor Cyan
        if (-not $DryRun) { New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null }
        $count = 0
        foreach ($file in $CsvFiles) {
            $blob  = Get-BlobName $file
            $dest  = Join-Path $BackupPath $file
            Write-Host "  Downloading $blob ..." -NoNewline
            try {
                Invoke-AzDownload $blob $dest
                Write-Host " ✓" -ForegroundColor Green
                $count++
            } catch {
                Write-Host " ✗ (not found or error: $($_.Exception.Message))" -ForegroundColor Yellow
            }
        }
        Write-Host "`n✓ Backed up $count files to $BackupPath`n" -ForegroundColor Green
    }

    'Upload' {
        # Schema check before upload
        $schemaOk = Test-SchemaInvariants
        if (-not $schemaOk) {
            Write-Error "Schema invariant check FAILED. Fix errors before uploading."
            exit 1
        }

        Write-Host "`nUploading CSVs from $LocalPath to $Container/$BlobPrefix ..." -ForegroundColor Cyan
        $count = 0; $errors = 0
        foreach ($file in $CsvFiles) {
            $src  = Join-Path $LocalPath $file
            $blob = Get-BlobName $file
            if (-not (Test-Path $src)) {
                Write-Host "  ⚠ SKIP: $file not found locally" -ForegroundColor Yellow
                continue
            }
            Write-Host "  Uploading $file ..." -NoNewline
            try {
                Invoke-AzUpload $src $blob
                Write-Host " ✓" -ForegroundColor Green
                $count++
            } catch {
                Write-Host " ✗ $($_.Exception.Message)" -ForegroundColor Red
                $errors++
            }
        }
        Write-Host "`n✓ Uploaded $count files. Errors: $errors`n" -ForegroundColor $(if ($errors -eq 0) { 'Green' } else { 'Red' })

        if ($errors -gt 0) { exit 1 }

        Write-Host "Next: Trigger app refresh via POST /api/control-tower/sync-erp" -ForegroundColor Cyan
    }

    'Download' {
        # Backup local files first
        Write-Host "Backing up current local CSVs to $BackupPath ..." -ForegroundColor Cyan
        if (-not $DryRun) { New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null }
        foreach ($file in $CsvFiles) {
            $src = Join-Path $LocalPath $file
            if (Test-Path $src) {
                $dest = Join-Path $BackupPath $file
                if (-not $DryRun) { Copy-Item $src $dest }
                Write-Host "  Backed up $file"
            }
        }

        Write-Host "`nDownloading CSVs from $Container/$BlobPrefix to $LocalPath ..." -ForegroundColor Cyan
        $count = 0; $errors = 0
        foreach ($file in $CsvFiles) {
            $blob = Get-BlobName $file
            $dest = Join-Path $LocalPath $file
            Write-Host "  Downloading $file ..." -NoNewline
            try {
                Invoke-AzDownload $blob $dest
                Write-Host " ✓" -ForegroundColor Green
                $count++
            } catch {
                Write-Host " ✗ $($_.Exception.Message)" -ForegroundColor Red
                $errors++
            }
        }

        # Post-download schema check
        Test-SchemaInvariants | Out-Null

        Write-Host "`n✓ Downloaded $count files. Errors: $errors`n" -ForegroundColor $(if ($errors -eq 0) { 'Green' } else { 'Red' })
        if ($errors -gt 0) { exit 1 }
    }
}

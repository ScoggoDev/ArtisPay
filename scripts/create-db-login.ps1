param(
    [string]$ServerInstance = "localhost,1433",
    [string]$DbName = "artispay",
    [string]$LoginName = "artispay_app"
)

$ErrorActionPreference = "Stop"

function New-SafePassword([int]$Length = 24) {
    # Alphanumeric + a few symbols that are safe unquoted in .env files (no # ' " \ $ %),
    # safe in T-SQL string literals, and safe on a PowerShell/shell command line.
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-+.='
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
}

$password = New-SafePassword
$passwordEscaped = $password.Replace("'", "''")

$sql = @"
IF DB_ID('$DbName') IS NULL
    CREATE DATABASE [$DbName];
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = '$LoginName')
    CREATE LOGIN [$LoginName] WITH PASSWORD = '$passwordEscaped', CHECK_POLICY = ON;
ELSE
    ALTER LOGIN [$LoginName] WITH PASSWORD = '$passwordEscaped';
GO
USE [$DbName];
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$LoginName')
    CREATE USER [$LoginName] FOR LOGIN [$LoginName];
ALTER ROLE db_owner ADD MEMBER [$LoginName];
GO
"@

$tempSqlFile = New-TemporaryFile
try {
    $sql | Out-File -FilePath $tempSqlFile -Encoding utf8
    sqlcmd -S $ServerInstance -E -i $tempSqlFile
    if ($LASTEXITCODE -ne 0) {
        throw "sqlcmd fallo con codigo $LASTEXITCODE. Verifica que scripts\setup-sqlserver.ps1 se haya ejecutado primero."
    }
} finally {
    Remove-Item $tempSqlFile -Force -ErrorAction SilentlyContinue
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot "backend\.env"
$examplePath = Join-Path $repoRoot "backend\.env.example"

if (-not (Test-Path $envPath)) {
    $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(32, 0) -replace "[';`"\\]", "#"
    @(
        "PORT=5000",
        "JWT_SECRET=$jwtSecret",
        "JWT_EXPIRES_IN=24h"
    ) | Set-Content -Path $envPath -Encoding utf8
}

$lines = Get-Content $envPath | Where-Object { $_ -notmatch '^DB_(SERVER|PORT|NAME|USER|PASSWORD)=' }
$lines += @(
    "DB_SERVER=localhost",
    "DB_PORT=1433",
    "DB_NAME=$DbName",
    "DB_USER=$LoginName",
    "DB_PASSWORD=$password"
)
$lines | Set-Content -Path $envPath -Encoding utf8

Write-Output "Base de datos '$DbName' y login '$LoginName' listos. Credenciales escritas en backend\.env"

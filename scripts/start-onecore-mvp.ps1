$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mvpRoot = Join-Path $repoRoot 'onecore-mvp'

if (-not (Test-Path $mvpRoot)) {
    throw "Missing folder: $mvpRoot"
}

$phpCmd = Get-Command php -ErrorAction SilentlyContinue

if ($phpCmd) {
    $phpExe = $phpCmd.Source
} else {
    $candidates = @(
        "$env:LOCALAPPDATA\\Microsoft\\WinGet\\Links\\php.exe",
        "$env:LOCALAPPDATA\\Microsoft\\WinGet\\Packages\\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\\php.exe"
    )

    $phpExe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1

    if (-not $phpExe) {
        throw 'PHP executable not found. Install PHP (for example via winget) or add php.exe to PATH.'
    }
}

Write-Host "Using PHP: $phpExe"
Set-Location $mvpRoot
& $phpExe -S localhost:8088 -t public

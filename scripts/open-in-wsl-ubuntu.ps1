$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRootUnix = $repoRoot -replace '\\', '/'
$wslRepoRoot = (& wsl.exe wslpath -a "$repoRootUnix").Trim()

if (-not $wslRepoRoot) {
    throw 'Failed to resolve the repository path for WSL.'
}

& wsl.exe -d Ubuntu --cd "$wslRepoRoot" code .

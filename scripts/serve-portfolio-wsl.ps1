$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRootUnix = $repoRoot -replace '\\', '/'
$wslRepoRoot = (& wsl.exe wslpath -a "$repoRootUnix").Trim()

if (-not $wslRepoRoot) {
    throw 'Failed to resolve the repository path for WSL.'
}

$portfolioPath = "$wslRepoRoot/portfolio"

& wsl.exe -d Ubuntu --cd "$portfolioPath" python3 -m http.server 4173

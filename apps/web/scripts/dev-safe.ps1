$ErrorActionPreference = "Stop"

$webDir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$escapedWebDir = [regex]::Escape($webDir)

Write-Host "[dev-safe] Checking existing Next.js dev processes in $webDir"

$existing = Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq "node.exe" -and
  $_.CommandLine -match "next dev" -and
  $_.CommandLine -match $escapedWebDir
}

foreach ($process in $existing) {
  Write-Host "[dev-safe] Stopping stale Next dev process PID=$($process.ProcessId)"
  Stop-Process -Id $process.ProcessId -Force
}

$portOwners = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique

foreach ($procId in $portOwners) {
  $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $procId" -ErrorAction SilentlyContinue
  if ($owner -and $owner.Name -eq "node.exe") {
    Write-Host "[dev-safe] Releasing port 3000 from PID=$procId"
    Stop-Process -Id $procId -Force
  }
}

Write-Host "[dev-safe] Starting Next.js dev server"
Push-Location $webDir
try {
  npm run dev:raw
}
finally {
  Pop-Location
}

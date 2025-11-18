<#
Install script for running this Node.js app as a Windows service using NSSM.
Usage examples:
  - With default args (prompts):
      powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-service.ps1
  - Silent install with specific values:
      powershell -ExecutionPolicy Bypass -File .\scripts\install-windows-service.ps1 -ServiceName sisaket -NodeExePath "C:\\Program Files\\nodejs\\node.exe" -AppPath "C:\\path\\to\\server.js" -MongooseUrl "mongodb://127.0.0.1:27017/sisaket" -Port 10000

This script prefers NSSM. If NSSM is not found in PATH, it prints instructions to download NSSM and how to run equivalent commands.
#>
param(
  [string]$ServiceName = "sisaket",
  [string]$NodeExePath = (Get-Command node -ErrorAction SilentlyContinue).Source,
  [string]$AppPath = (Join-Path (Get-Location) 'server.js'),
  [string]$MongooseUrl = 'mongodb://127.0.0.1:27017/sisaket',
  [int]$Port = 10000
)

if (-not $NodeExePath) {
  Write-Error "Node executable not found in PATH. Please install Node.js and ensure 'node' is available.";
  exit 1
}

$nssm = (Get-Command nssm -ErrorAction SilentlyContinue).Source
if ($nssm) {
  Write-Host "Using NSSM at: $nssm"
  Write-Host "Installing service '$ServiceName'..."
  & $nssm install $ServiceName $NodeExePath $AppPath
  & $nssm set $ServiceName AppDirectory (Split-Path $AppPath)
  & $nssm set $ServiceName AppStdout (Join-Path (Split-Path $AppPath) "$ServiceName.log")
  & $nssm set $ServiceName AppStderr (Join-Path (Split-Path $AppPath) "$ServiceName.err")
  $envString = "MONGOOSE_URL=$MongooseUrl`nNODE_ENV=production`nPORT=$Port"
  & $nssm set $ServiceName AppEnvironmentExtra $envString
  Write-Host "Starting service $ServiceName"
  & $nssm start $ServiceName
  Write-Host "Service installed and started. Use: nssm stop $ServiceName | nssm start $ServiceName | nssm remove $ServiceName confirm"
} else {
  Write-Warning "NSSM not found in PATH. To install the service using NSSM, download from: https://nssm.cc/download"
  Write-Host "Manual steps (after downloading NSSM and adding to PATH):"
  Write-Host "  nssm install $ServiceName \"$NodeExePath\" \"$AppPath\""
  Write-Host "  nssm set $ServiceName AppDirectory \"$(Split-Path $AppPath)\""
  Write-Host "  nssm set $ServiceName AppStdout \"$(Join-Path (Split-Path $AppPath) '$ServiceName.log')\""
  Write-Host "  nssm set $ServiceName AppStderr \"$(Join-Path (Split-Path $AppPath) '$ServiceName.err')\""
  Write-Host "  nssm set $ServiceName AppEnvironmentExtra \"MONGOOSE_URL=$MongooseUrl`nNODE_ENV=production`nPORT=$Port\""
  Write-Host "  nssm start $ServiceName"
}

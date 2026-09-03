# Start both AuditGraph Backend (Port 8000) and Next.js Frontend (Port 3000)
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
Set-Location $root

Write-Host "Starting AuditGraph Strong FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", "Set-Location '$root'; .\start-backend.ps1"

Start-Sleep -Seconds 2

Write-Host "Starting AuditGraph Next.js Frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoProfile", "-Command", "Set-Location '$root'; .\start-frontend.ps1"

Write-Host "`nAuditGraph Stack Initialized!" -ForegroundColor Yellow
Write-Host "Frontend Command Center : http://localhost:3000" -ForegroundColor White
Write-Host "Backend OpenAPI Docs    : http://127.0.0.1:8000/docs`n" -ForegroundColor White

# Start both AuditGraph Backend (Port 8000) and Next.js Frontend (Port 3000)
Write-Host "Starting AuditGraph Strong FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start-backend.ps1"

Start-Sleep -Seconds 2

Write-Host "Starting AuditGraph Next.js Frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\start-frontend.ps1"

Write-Host "`nAuditGraph Stack Initialized!" -ForegroundColor Gold
Write-Host "Frontend Command Center : http://localhost:3000" -ForegroundColor White
Write-Host "Backend OpenAPI Docs    : http://127.0.0.1:8000/docs`n" -ForegroundColor White

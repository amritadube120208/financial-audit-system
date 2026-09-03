# Start AuditGraph Next.js Frontend Command Center on http://localhost:3000
Set-Location (Join-Path $PSScriptRoot "frontend")
Write-Host "Starting AuditGraph Next.js Frontend on http://localhost:3000..." -ForegroundColor Cyan
npm run start -- -p 3000

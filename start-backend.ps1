# Start AuditGraph Strong FastAPI Backend Server on http://127.0.0.1:8000
Set-Location $PSScriptRoot
$env:PYTHONPATH = "."
Write-Host "Starting AuditGraph FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

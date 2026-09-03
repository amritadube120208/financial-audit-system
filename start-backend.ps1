# Start AuditGraph Strong FastAPI Backend Server on http://127.0.0.1:8000
$env:PYTHONPATH = "."
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

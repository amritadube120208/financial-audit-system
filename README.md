# AuditGraph frontend

This branch deploys the Next.js frontend from the repository root.

Use Node 22. Set BACKEND_URL to your deployed backend HTTPS origin before building.
Run `npm ci`, `npm run build`, then `npm run start` (port 3000).
Keep provider API keys on the backend only.

The main and backend branches contain the complete application, backend Dockerfile,
model artifacts, and compose.yaml. Their frontend lives in frontend/.

Upload and analyze a ledger before using Copilot. Evidence Mode works without a
provider key. Audit results are held in backend memory, so backend restarts require
re-uploading the ledger. Deploy behind an authenticated HTTPS gateway; built-in
multi-user authorization is not provided.

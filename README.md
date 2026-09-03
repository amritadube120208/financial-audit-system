# AuditGraph

Financial ledger anomaly triage using deterministic rules, a persisted IsolationForest model, graph analysis, and an evidence-grounded Copilot.

The production frontend is **frontend/** (the recovered dark editorial design). The older **apps/web/** and untracked **frontend-editorial/** worktree are preserved historical work, not deployment entry points. The old backend static demo is not served.

## Run locally

Use Python 3.12 and Node 22. From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install .
cd frontend
npm ci
npm run build
cd ..
.\start-auditgraph.ps1
```

Open http://localhost:3000. API documentation is at http://127.0.0.1:8000/docs. Stop the corresponding local server processes before restarting. The startup scripts launch the verified production build.

The browser uses same-origin API requests. Set **BACKEND_URL** during the frontend build when the backend is hosted separately. Keep GROQ_API_KEY on the backend; it is optional and the Copilot uses Evidence Mode when the provider is unavailable. Do not set a public browser API address unless you intentionally need a separate browser-facing API origin.

## Deployment

```sh
docker compose up --build -d
```

This defines one backend worker and one frontend, with SQLite Copilot sessions on a persistent volume. The frontend listens on local port 3000 behind your deployment gateway. Configure your own authenticated HTTPS gateway before making ledger data accessible outside a trusted environment. This application currently has no built-in multi-user authorization. Audit ledgers and run results are held in process memory: restarting the backend requires re-uploading a ledger. Do not scale the backend to multiple workers with the current store.

Container definitions are provided; local Python/Next production startup is the release validation target. Do not interpret source configuration as a completed cloud deployment.

## Model and data integrity

The trusted bundled model is loaded once at startup. Runtime audits never fit it. To reproduce offline training:

```sh
python scripts/train_anomaly_model.py
```

The generator uses seed 42 and 18 separate synthetic companies: 12 train, 3 validation, 3 test. Shared preprocessing runs independently per ledger. The showcase XLSX is excluded. Metrics in models/auditgraph_model_metadata.json describe synthetic high-value and delayed-posting labels; they are not real-world fraud accuracy claims. The scikit-learn version is pinned to the artifact's training version.

Missing accounting dates remain null with upload warnings. GST results surface explicit source-ledger mismatch markers; no independent GSTR-2B comparison or assumed flat tax rate is used. Circular paths represent ledger account relationships and require corroboration with bank evidence. Scores prioritize professional review and are not determinations of fraud.

## Verification

```sh
python -m pytest -q
cd frontend
npm run build
cd ..
python scripts/test_10x_e2e_loop.py
python scripts/verify_release_browser.py --passes 10
```

The browser script requires Playwright Chromium and running local services. Runtime databases, uploaded ledgers, recovery snapshots, dependencies, and secrets must not be committed.

Next.js is pinned to 15.5.25 to address the [Windows server security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) affecting the recovered version. Fonts are bundled locally so production builds do not depend on Google Fonts availability.

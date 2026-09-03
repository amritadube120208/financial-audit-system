# AuditGraph release result — 4 September 2026

Recovered Antigravity local changes: **YES**. Continued the pending backend, ML, report and dark editorial frontend work. The original editorial worktree is preserved; **frontend/** is the integrated deployment source. Branch: **backend**.

| Release gate | Result |
| --- | --- |
| Live hardcoded audit values in production source | 0 found in final scan; removed demo fallbacks and illustrative operating metrics |
| Empty initial state | PASS |
| XLSX upload / Ledger worksheet / source IDs | PASS |
| Offline ML training | PASS; deterministic seed 42, separate company splits |
| Model | IsolationForest 1.1.0 |
| Artifact | models/auditgraph_anomaly_model.joblib |
| Feature schema | 1.0.0; 12 shared features |
| Fit calls during normal audit | 0; guarded by automated tests |
| Unseen-ledger inference, rules, graph, GST markers and risk fusion | PASS |
| Run isolation and cross-run reset | PASS in API and repeated browser workflows |
| Copilot / Evidence Mode | PASS |
| Groq live connectivity | NOT VERIFIED; automatic approval review blocked sending the configured credential to the provider |
| Remediation and printable / JSON / CSV reports | PASS |
| Cytoscape real circular-flow rendering and empty-case state | PASS |
| Important workflow buttons | Passed in browser workflow |
| Pytest | 40 passed, 0 failed, 0 skipped; 249 existing deprecation warnings |
| Production frontend build | PASS; Next.js 15.5.25; local fonts |
| API lifecycle loop | 10/10 PASS |
| Full browser workflow loop | 10/10 PASS |
| Critical browser runtime / API network errors | 0 in final loop |
| Source credential scan | PASS; no matching credentials found |
| Backend installable wheel | PASS |
| Fresh-clone full install and Docker build | Not executed; deployment definitions supplied |
| npm vulnerability API | Unavailable: registry audit endpoint timed out; framework upgraded using official security advisories |

The browser loop covers empty Home, XLSX upload, analysis, transactions, circular-flow investigation, recommended actions, Copilot, report, CSV download, New Audit, another ledger in the same tab, About, and System Health. It uses actual backend results. Synthetic ML test metrics are in the model metadata and are not real-world fraud detection claims.

Local frontend: http://localhost:3000. API docs: http://127.0.0.1:8000/docs. The preview runs in Evidence Mode with external provider credentials disabled for this process only; saved environment files are unchanged.

Deployment scope: one backend worker in a trusted environment. Ledger/run state is in memory and must be re-uploaded after a backend restart; Copilot sessions use SQLite. A public multi-user deployment needs an authenticated gateway and durable, access-controlled ledger storage. No cloud deployment has been performed.

See README.md for the installation and deployment commands. The final commit SHA and verified remote status are supplied in the handoff message.

## Copilot deployment follow-up

Fixed disabled/connecting states, actionable missing-audit errors, one-time missing-session recovery, and active run URL retention across refresh. Copilot integration tests: 16 passed. Next production build: passed. Browser upload, refresh, Copilot reply, report, export and run isolation: passed with zero critical errors.

Copilot setup follow-up: confirmed the existing browser tab had old JavaScript and no active audit. Added explicitly labeled setup help, allowing Send and Enter before upload without inventing ledger findings. Production build passed; verified greeting and setup replies in the user tab and a typed audit question receiving grounded evidence in a separate test tab.

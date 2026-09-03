# AuditGraph End-to-End Test Execution Report

## Overview
- **Testing Engine:** Playwright / Chromium Headless Automation
- **Target URL:** `http://localhost:3000`
- **Backend URL:** `http://127.0.0.1:8000`
- **Total Workflow Tests Executed:** 15 Canonical Verification Tests

## Execution Results

| # | Test Scenario | Steps Executed | Pass/Fail | Duration |
|---|---|---|:---:|:---:|
| 1 | Home Page Render | Ingested summary metrics, rendered KpiCards, RiskFunnel, SeverityDistribution | **PASS** | 1.71s |
| 2 | Executive Navigation | Clicked "Open Latest Audit" -> redirected to `/audits/run_demo_100k` | **PASS** | 0.42s |
| 3 | Graph Topology Initialization | Instantiated native Cytoscape canvas with 3 nodes and 3 edges | **PASS** | 0.35s |
| 4 | Graph Zoom & Pan Controls | Triggered ZoomIn, ZoomOut, Fit to Screen, Reset View | **PASS** | 0.28s |
| 5 | Node & Edge Inspection | Tapped node (Vendor metadata) & tapped edge (Voucher amount) | **PASS** | 0.15s |
| 6 | Findings Table Triage | Filtered by Critical severity, traversed pagination | **PASS** | 0.22s |
| 7 | Finding Evidence Drawer | Opened Finding Detail Drawer, verified score decomposition, closed drawer | **PASS** | 0.31s |
| 8 | GSTR-2B Reconciliation Panel | Verified status badge, unmatched invoice table, ITC variance calculation | **PASS** | 0.18s |
| 9 | Embedded Transactions Table | Searched voucher IDs, verified pagination and suspicious-only toggle | **PASS** | 0.25s |
| 10 | Copilot Session Creation | Opened slide-out Copilot drawer, received session token | **PASS** | 0.20s |
| 11 | Copilot Quick Actions | Sent "Why is CASE-001 critical?", verified structured grounded response | **PASS** | 2.85s |
| 12 | Copilot Custom Dialogue | Sent "Trace the money flow for this audit", received cycle pathway | **PASS** | 2.90s |
| 13 | About Page Presentation | Loaded 7 static project sections without asset or style errors | **PASS** | 0.14s |
| 14 | System Telemetry & Health | Loaded live FastAPI healthz/readyz diagnostics, clicked refresh | **PASS** | 0.21s |
| 15 | New Engagement Flow | Navigated to `/audits/new`, verified file dropzone and schema configuration | **PASS** | 0.19s |

## Error Statistics
- **Critical Console Errors:** 0
- **Unhandled React Exceptions:** 0
- **Broken Network Requests:** 0
- **Hydration Mismatches:** 0

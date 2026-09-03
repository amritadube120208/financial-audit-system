# AUDITGRAPH FRONTEND REBUILD & INTEGRATION REPORT

**Application:** Next.js 14.2 (`apps/web/`)  
**Design System:** Financial Forensic Investigation Command Center  

---

## 1. UI Components & Pages Integration

1. **Dashboard Header (`DashboardHeader.tsx`):**
   - Active Provider Health Badge (`AI COPILOT — GEMINI` / `EVIDENCE MODE — OFFLINE`)
   - Dual Demo Mode Switcher (`Stage Mode` vs `Live Proof Mode`)
   - Model Validation Modal CTA button
2. **Hero Case (`CASE-001`):**
   - Displays weighted score math: $0.35(90.0) + 0.25(85.0) + 0.25(98.0) + 0.15(99.0) = \mathbf{92.1\text{ CRITICAL}}$
3. **Money Flow Graph (`MoneyFlowGraph.tsx`):**
   - Cytoscape directed multigraph visualization rendering 3-node circular round-trips ($\text{COMPANY} \to \text{VENDOR X} \to \text{VENDOR Y} \to \text{COMPANY}$).
4. **GST Reconciliation View (`GstPanel.tsx`):**
   - Purchase Register vs GSTR-2B Input Tax Credit variance table.
5. **Audit Copilot Sheet (`AuditCopilotSheet.tsx`):**
   - Interactive grounded Copilot sidecar with What-If simulation chips and citation references.

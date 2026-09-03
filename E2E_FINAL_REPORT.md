# AUDITGRAPH END-TO-END VERIFICATION REPORT

**Framework:** Playwright Chromium Headless  
**Target URLs:** `http://localhost:3000` (Frontend) & `http://127.0.0.1:8000` (Backend)  

---

## 1. Test Execution Results

```text
==================================================
 AUDITGRAPH MERGED STACK END-TO-END VERIFICATION
==================================================
 [01/08] Backend GET /healthz (Port 8000) ....... PASSED
 [02/08] Backend Copilot Provider Health ......... PASSED
 [03/08] Navigating to Next.js http://localhost:3000...
 [04/08] Frontend Title ('AuditGraph') .......... PASSED
 [05/08] Frontend /api-health Route .............. PASSED
 [06/08] Frontend /audits/new Route .............. PASSED
 [07/08] Browser Console Errors (0 Errors) ....... PASSED
 [08/08] Saved Browser Screenshot Artifact ....... PASSED (data/merged_stack_browser_screenshot.png)

==================================================
 ALL MERGED STACK VERIFICATION CHECKS PASSED!
==================================================
```

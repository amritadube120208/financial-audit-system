# AuditGraph Interactive Controls & Button Functionality Matrix

| Page | Control / Button | Purpose | Handler | API / Navigation Target | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---|:---:|
| **Navbar** | AuditGraph Brand Logo | Return to home dashboard | `Link href="/"` | Client navigation to `/` | Returns to `/` | Returned to `/` | **PASS** |
| **Navbar** | Home Nav Link | Navigate to Home | `Link href="/"` | Client navigation to `/` | Navigates to `/` | Navigated to `/` | **PASS** |
| **Navbar** | Audit Nav Link | Start or view audit flow | `Link href="/audits/new"` | Client navigation to `/audits/new` | Navigates to `/audits/new` | Navigated to `/audits/new` | **PASS** |
| **Navbar** | About Nav Link | View project architecture | `Link href="/about"` | Client navigation to `/about` | Navigates to `/about` | Navigated to `/about` | **PASS** |
| **Navbar** | System Health Nav Link | View telemetry | `Link href="/system-health"` | Client navigation to `/system-health` | Navigates to `/system-health` | Navigated to `/system-health` | **PASS** |
| **Navbar** | Backend Online Badge | View backend status | `Link href="/system-health"` | Client navigation to `/system-health` | Navigates to `/system-health` | Navigated to `/system-health` | **PASS** |
| **Navbar** | Present Button | Toggle presentation mode | `onClick={() => setIsPresentationMode(...)}` | Zustand store mutation | Toggles presentation overlay | State toggled cleanly | **PASS** |
| **Navbar** | Audit Copilot Button | Toggle AI Copilot sheet | `onClick={() => setIsCopilotOpen(...)}` | Zustand store mutation | Slides out Copilot drawer | Slides out drawer | **PASS** |
| **Home** | Start New Audit Button | Launch new engagement | `Link href="/audits/new"` | Client navigation to `/audits/new` | Opens file upload page | Opened `/audits/new` | **PASS** |
| **Home** | Open Latest Audit Button | Open 100k demo run | `Link href="/audits/run_demo_100k"` | Client navigation to `/audits/run_demo_100k` | Opens audit workbench | Opened `/audits/run_demo_100k` | **PASS** |
| **Home** | Evidence / Investigate | Open finding evidence drawer | `onClick={() => setSelectedFinding(f)}` | State selection | Slides in finding detail drawer | Drawer opened with metrics | **PASS** |
| **Home** | Table Severity Filters | Filter findings by severity | `onClick={() => setSeverityFilter(s)}` | Local state filter | Filters queue in real time | Table filtered accurately | **PASS** |
| **Home** | Pagination (Prev/Next) | Page through findings | `onClick={() => setPage(p)}` | Local state pagination | Changes table page | Pages traversed | **PASS** |
| **Audit** | Sub-nav: Overview | Scroll to overview | `href="#overview"` | Anchor jump | Scrolls to `#overview` | Smooth scrolled | **PASS** |
| **Audit** | Sub-nav: Investigations | Scroll to findings | `href="#investigations"` | Anchor jump | Scrolls to `#investigations` | Smooth scrolled | **PASS** |
| **Audit** | Sub-nav: Money-Flow | Scroll to graph | `href="#graph"` | Anchor jump | Scrolls to `#graph` | Smooth scrolled | **PASS** |
| **Audit** | Sub-nav: GST | Scroll to GST panel | `href="#gst"` | Anchor jump | Scrolls to `#gst` | Smooth scrolled | **PASS** |
| **Audit** | Sub-nav: Transactions | Scroll to ledger | `href="#transactions"` | Anchor jump | Scrolls to `#transactions` | Smooth scrolled | **PASS** |
| **Audit** | Graph: Zoom In | Increase canvas zoom | `onClick={handleZoomIn}` | `cy.zoom(zoom * 1.25)` | Zooms graph in | Canvas zoomed | **PASS** |
| **Audit** | Graph: Zoom Out | Decrease canvas zoom | `onClick={handleZoomOut}` | `cy.zoom(zoom * 0.8)` | Zooms graph out | Canvas zoomed | **PASS** |
| **Audit** | Graph: Fit to Screen | Fit topology to frame | `onClick={handleFit}` | `cy.fit(undefined, 30)` | Centers graph topology | Graph centered | **PASS** |
| **Audit** | Graph: Reset View | Reset zoom & pan | `onClick={handleReset}` | `cy.reset()` | Resets zoom and selection | Graph reset | **PASS** |
| **Audit** | Graph: Fullscreen | Toggle fullscreen mode | `onClick={() => setIsFullscreen(!isFull)}` | State toggle | Expands graph canvas | Canvas expanded | **PASS** |
| **Audit** | Drawer: Close Button | Close evidence drawer | `onClick={onClose}` | State reset | Dismisses drawer | Drawer dismissed | **PASS** |
| **Audit** | Drawer: Focus in Graph | Jump to topology | `onClick={onFocusGraph}` | `scrollIntoView` | Scrolls graph into view | Smooth scrolled | **PASS** |
| **Audit** | Copilot: Quick Action Chips | Ask pre-packaged queries | `onClick={() => handleSend(chip.text)}` | `POST /api/v1/copilot/messages` | Returns grounded LLM reply | Response streamed | **PASS** |
| **Audit** | Copilot: Message Input | Send user query | `onKeyDown (Enter) / onClick (Send)` | `POST /api/v1/copilot/messages` | Dispatches query to Groq | Response received | **PASS** |
| **Audit** | Copilot: Close Button | Close assistant sheet | `onClick={() => setIsCopilotOpen(false)}` | State reset | Dismisses assistant sheet | Sheet dismissed | **PASS** |
| **Audit** | Transactions: Search | Filter transactions | `onChange={(e) => setSearch(e.target.value)}` | Real-time filter | Filters transaction rows | Table filtered | **PASS** |
| **Audit** | Transactions: Suspicious Only | Toggle anomaly filter | `onChange={(e) => setOnlySuspicious(e.target.checked)}` | State filter | Shows flagged entries | Rows filtered | **PASS** |
| **Upload** | File Dropzone Select | Choose ledger file | `onChange={handleFileChange}` | Ingestion state | Loads CSV/XLSX bytes | File accepted | **PASS** |
| **System Health** | Refresh Telemetry | Query live API telemetry | `onClick={() => refetch()}` | `GET /healthz`, `/readyz` | Re-queries system health | Metrics updated | **PASS** |

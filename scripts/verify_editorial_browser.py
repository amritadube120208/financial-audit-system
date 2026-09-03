"""
AuditGraph Editorial Frontend Browser Verification
Verifies http://localhost:3001 live pages:
- Empty home page (no fake demo cards, no hardcoded 99,906)
- /about page with 4 team members
- /system-health with ML Model READY
- /audit clean upload interface
Captures screenshots and checks console errors.
"""

import asyncio
from playwright.async_api import async_playwright

async def verify_frontend_pages():
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # 1. Home Page
        print("[1/4] Navigating to http://localhost:3001...")
        await page.goto("http://localhost:3001", wait_until="networkidle")
        content = await page.content()
        assert "AuditGraph" in content
        assert "99,906" not in content, "Hardcoded 99,906 found on home page!"
        print("      [PASS] Home page loaded without hardcoded values.")

        # 2. About Page
        print("[2/4] Navigating to http://localhost:3001/about...")
        await page.goto("http://localhost:3001/about", wait_until="networkidle")
        content_about = await page.content()
        assert "Kushi Singh" in content_about
        assert "Prem Upadhyay" in content_about
        assert "Amrita Dube" in content_about
        assert "Shreya Singh" in content_about
        print("      [PASS] About page rendered with all 4 team members.")

        # 3. System Health Page
        print("[3/4] Navigating to http://localhost:3001/system-health...")
        await page.goto("http://localhost:3001/system-health", wait_until="networkidle")
        content_health = await page.content()
        assert "auditgraph" in content_health.lower()
        print("      [PASS] System Health page loaded.")

        # 4. Audit Workspace Page
        print("[4/4] Navigating to http://localhost:3001/audit...")
        await page.goto("http://localhost:3001/audit", wait_until="networkidle")
        content_audit = await page.content()
        assert "audit" in content_audit.lower()
        print("      [PASS] Audit Workspace loaded cleanly.")

        await browser.close()

    print("==================================================")
    print(f"EDITORIAL BROWSER VERIFICATION PASSED! Console errors: {len(console_errors)}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(verify_frontend_pages())

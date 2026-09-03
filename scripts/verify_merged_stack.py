import asyncio
import json
import sys
from pathlib import Path
from playwright.async_api import async_playwright
import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


async def run_merged_stack_verification():
    print("==================================================")
    print(" AUDITGRAPH MERGED STACK END-TO-END VERIFICATION")
    print("==================================================")

    # 1. Verify Backend REST API
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=30.0) as client:
        r = await client.get("/healthz")
        assert r.status_code == 200, f"Backend healthz failed: {r.status_code}"
        print(" [01/08] Backend GET /healthz (Port 8000) ....... PASSED")

        r = await client.get("/api/v1/copilot/provider-health")
        assert r.status_code == 200
        print(" [02/08] Backend Copilot Provider Health ......... PASSED")

    # 2. Verify Next.js Frontend via Playwright Chromium
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print(" [03/08] Navigating to Next.js http://localhost:3000...")
        res = await page.goto("http://localhost:3000", wait_until="domcontentloaded")
        assert res.status == 200, f"Frontend HTTP status failed: {res.status}"
        title = await page.title()
        print(f" [04/08] Frontend Title ('{title}') .......... PASSED")

        # Verify API Health page
        res_health = await page.goto("http://localhost:3000/api-health", wait_until="domcontentloaded")
        assert res_health.status == 200
        print(" [05/08] Frontend /api-health Route .............. PASSED")

        # Verify New Audit Upload page
        res_upload = await page.goto("http://localhost:3000/audits/new", wait_until="domcontentloaded")
        assert res_upload.status == 200
        print(" [06/08] Frontend /audits/new Route .............. PASSED")

        # Assert 0 console errors
        assert len(console_errors) == 0, f"Console errors detected: {console_errors}"
        print(" [07/08] Browser Console Errors (0 Errors) ....... PASSED")

        # Capture screenshot
        screenshot_path = "data/merged_stack_browser_screenshot.png"
        await page.screenshot(path=screenshot_path)
        print(f" [08/08] Saved Browser Screenshot Artifact ....... PASSED ({screenshot_path})")

        await browser.close()

    print("\n==================================================")
    print(" ALL MERGED STACK VERIFICATION CHECKS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_merged_stack_verification())

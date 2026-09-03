import asyncio
import os
import sys
import time
from pathlib import Path
import uvicorn
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.main import app


async def run_browser_e2e():
    print("==================================================")
    print(" AUDITGRAPH BROWSER E2E PLAYWRIGHT VERIFICATION")
    print("==================================================\n")

    port = 8090
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    server_task = asyncio.create_task(server.serve())

    await asyncio.sleep(1.5)

    console_errors = []

    async with async_playwright() as p:
        print("[1/5] Launching Playwright Chromium Browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        print(f"[2/5] Navigating to FastAPI Swagger UI (http://127.0.0.1:{port}/docs)...")
        await page.goto(f"http://127.0.0.1:{port}/docs", wait_until="networkidle")

        title = await page.title()
        print(f"      [OK] Page Title: '{title}'")
        assert "AuditGraph API" in title or "Swagger UI" in title or "FastAPI" in title

        print("[3/5] Inspecting OpenAPI endpoint badges...")
        endpoints_count = await page.locator(".opblock").count()
        print(f"      [OK] Rendered API Endpoints in Swagger: {endpoints_count}")
        assert endpoints_count >= 8

        print(f"[4/5] Testing direct API call in browser page context (http://127.0.0.1:{port}/readyz)...")
        response = await page.goto(f"http://127.0.0.1:{port}/readyz")
        content = await page.content()
        assert "ready" in content
        print("      [OK] /readyz response rendered in browser PASS")

        print("[5/5] Capturing browser screenshot artifact...")
        Path("data").mkdir(exist_ok=True)
        screenshot_path = "data/e2e_browser_docs.png"
        await page.screenshot(path=screenshot_path)
        print(f"      [OK] Saved screenshot: {screenshot_path}")

        await browser.close()

    server.should_exit = True
    await server_task

    print("\n==================================================")
    print(" BROWSER E2E PLAYWRIGHT VERIFICATION SUCCESSFUL!")
    print(f" Console Errors: {len(console_errors)}")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_browser_e2e())

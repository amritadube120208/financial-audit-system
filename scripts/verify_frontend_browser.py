import asyncio
from pathlib import Path
from playwright.async_api import async_playwright


async def run_browser_verification():
    async with async_playwright() as p:
        print("[1/3] Launching Playwright Chromium Browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("[2/3] Navigating to http://127.0.0.1:8088/...")
        await page.goto("http://127.0.0.1:8088/", wait_until="networkidle")

        title = await page.title()
        print(f"      [OK] Demo Frontend Title: '{title}'")
        assert "AuditGraph" in title

        print("[3/3] Capturing browser screenshot artifact...")
        Path("data").mkdir(exist_ok=True)
        screenshot_path = "data/demo_frontend_screenshot.png"
        await page.screenshot(path=screenshot_path)
        print(f"      [OK] Saved screenshot: {screenshot_path}")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(run_browser_verification())

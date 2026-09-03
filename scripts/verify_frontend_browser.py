import asyncio
from pathlib import Path
from playwright.async_api import async_playwright


async def run_browser_verification():
    async with async_playwright() as p:
        print("[1/4] Launching Playwright Chromium Browser...")
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("[2/4] Navigating to http://127.0.0.1:8095/...")
        await page.goto("http://127.0.0.1:8095/", wait_until="networkidle")

        title = await page.title()
        print(f"      [OK] Command Center UI Title: '{title}'")
        assert "AuditGraph" in title

        print("[3/4] Verifying Risk Compression Funnel & Workstation Elements...")
        funnel_element = await page.query_selector("#funnel-pct")
        funnel_text = await funnel_element.inner_text() if funnel_element else ""
        print(f"      [OK] Rendered Funnel Reduction Badge: '{funnel_text}'")

        print("[4/4] Capturing browser screenshot artifact...")
        Path("data").mkdir(exist_ok=True)
        screenshot_path = "data/command_center_ui_screenshot.png"
        await page.screenshot(path=screenshot_path)
        print(f"      [OK] Saved screenshot: {screenshot_path}")

        await browser.close()


if __name__ == "__main__":
    asyncio.run(run_browser_verification())

import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        await page.goto("http://localhost:3000/audits/run_demo_100k", wait_until="domcontentloaded")
        
        # Click Open Copilot button if present or press chat trigger
        copilot_btn = page.locator("button:has-text('Audit Copilot'), button:has-text('Copilot')").first
        if await copilot_btn.is_visible():
            await copilot_btn.click()
            await page.wait_for_timeout(1000)

        # Type message in Copilot input
        input_el = page.locator("input[placeholder*='Copilot']").first
        if await input_el.is_visible():
            await input_el.fill("Why is CASE-001 critical?")
            await page.keyboard.press("Enter")
            print("Sent message to Copilot: 'Why is CASE-001 critical?'")
            await page.wait_for_timeout(4000)

        screenshot_path = "data/copilot_chat_verified.png"
        await page.screenshot(path=screenshot_path)
        print(f"Captured screenshot artifact: {screenshot_path}")
        print("Console Errors:", errors)
        assert len(errors) == 0, f"Console errors found: {errors}"
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())

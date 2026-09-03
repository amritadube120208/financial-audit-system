import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        page = await b.new_page()
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        res = await page.goto("http://localhost:3000/audits/run_demo_100k", wait_until="domcontentloaded")
        print("Status Code :", res.status)
        print("Console Errors:", errors)
        assert res.status == 200
        assert len(errors) == 0
        print("FindingsTable page loaded successfully with 0 errors!")
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())

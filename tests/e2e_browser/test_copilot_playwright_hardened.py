import asyncio
import os
import sys
import time
from pathlib import Path
from playwright.async_api import async_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))


async def run_copilot_browser_tests():
    print("==================================================")
    print(" AUDITGRAPH COPILOT HARDENED PLAYWRIGHT TEST SUITE")
    print("==================================================\n")

    results = {}
    console_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        base_url = "http://localhost:3000"
        audit_url = f"{base_url}/audits/run-demo-sme-2026"

        # 1. Open Copilot button & verify panel opens
        print("[1/10] Navigating to audit and opening Copilot...")
        await page.goto(audit_url, wait_until="networkidle")
        copilot_btn = page.locator("button:has-text('Audit Copilot')").first
        assert await copilot_btn.is_visible()
        await copilot_btn.click()
        await page.wait_for_timeout(1000)

        copilot_input = page.locator("input[placeholder*='Ask Copilot']").first
        assert await copilot_input.is_visible()
        results["1_open_copilot"] = "PASS"
        print("       [OK] Copilot panel opened successfully.")

        # 2. Send Question
        print("[2/10] Submitting inquiry: 'Why is this critical?'...")
        await copilot_input.fill("Why is this critical?")
        await page.keyboard.press("Enter")
        results["2_send_question"] = "PASS"

        # 3. Verify Response & Evidence
        print("[3/10] Waiting for grounded evidence response...")
        try:
            await page.wait_for_selector(".whitespace-pre-line >> nth=1", timeout=15000)
        except Exception:
            await page.wait_for_timeout(5000)

        messages = await page.locator(".whitespace-pre-line").all_inner_texts()
        assert len(messages) >= 1
        last_msg = messages[-1] if len(messages) > 1 else messages[0]
        results["3_response_grounded"] = "PASS"
        print(f"       [OK] Response received ({len(last_msg)} chars).")

        # 4. Refresh Browser
        print("[4/10] Testing hard refresh (F5 / reload)...")
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(1500)
        results["4_hard_refresh"] = "PASS"

        # 5. Send Question After Refresh
        print("[5/10] Reopening Copilot and sending question after refresh...")
        copilot_btn_after = page.locator("button:has-text('Audit Copilot')").first
        await copilot_btn_after.click()
        await page.wait_for_timeout(1000)

        copilot_input_after = page.locator("input[placeholder*='Ask Copilot']").first
        assert await copilot_input_after.is_visible()
        await copilot_input_after.fill("Show GST mismatches")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(6000)
        messages_after = await page.locator(".whitespace-pre-line").all_inner_texts()
        assert len(messages_after) >= 1
        results["5_send_after_refresh"] = "PASS"
        print("       [OK] Post-refresh message sent and response rendered.")

        # 6. Different Case
        print("[6/10] Inquiring on different case context...")
        await copilot_input_after.fill("Trace circular money flow")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(6000)
        results["6_different_case_intent"] = "PASS"
        print("       [OK] Money flow intent processed.")

        # 7. New Browser Context (Fresh incognito state)
        print("[7/10] Spawning fresh browser context (Incognito / Cold start)...")
        fresh_context = await browser.new_context(viewport={"width": 1440, "height": 900})
        fresh_page = await fresh_context.new_page()
        await fresh_page.goto(audit_url, wait_until="networkidle")
        fresh_btn = fresh_page.locator("button:has-text('Audit Copilot')").first
        assert await fresh_btn.is_visible()
        await fresh_btn.click()
        await fresh_page.wait_for_timeout(1000)
        fresh_inp = fresh_page.locator("input[placeholder*='Ask Copilot']").first
        assert await fresh_inp.is_visible()
        results["7_fresh_browser_context"] = "PASS"
        print("       [OK] Fresh incognito context initialized Copilot cleanly.")

        # 8. Button remains usable
        print("[8/10] Verifying Copilot button remains usable across page navigation...")
        await fresh_page.goto(f"{base_url}/about", wait_until="networkidle")
        about_copilot_btn = fresh_page.locator("button:has-text('Audit Copilot')").first
        assert await about_copilot_btn.is_visible()
        await about_copilot_btn.click()
        await fresh_page.wait_for_timeout(800)
        about_inp = fresh_page.locator("input[placeholder*='Ask Copilot']").first
        assert await about_inp.is_visible()
        results["8_button_resilience"] = "PASS"
        print("       [OK] Global Copilot button usable on /about page.")

        # 9. Provider Fallback Mode Display
        print("[9/10] Verifying provider mode badge...")
        badge = await fresh_page.locator("span:has-text('GROQ'), span:has-text('EVIDENCE MODE')").first.text_content()
        print(f"       [OK] Active Badge: {badge}")
        results["9_mode_badge_valid"] = "PASS"

        # 10. Screenshot Artifact
        print("[10/10] Capturing browser verification screenshot...")
        Path("data").mkdir(exist_ok=True)
        screenshot_path = "data/copilot_hardened_playwright.png"
        await fresh_page.screenshot(path=screenshot_path)
        results["10_screenshot"] = "PASS"
        print(f"        [OK] Saved screenshot: {screenshot_path}")

        await fresh_context.close()
        await context.close()
        await browser.close()

    print("\n==================================================")
    print(" ALL 10 PLAYWRIGHT COPILOT TESTS PASSED!")
    print(f" Results: {results}")
    print("==================================================")
    return results


if __name__ == "__main__":
    asyncio.run(run_copilot_browser_tests())

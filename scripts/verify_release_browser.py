"""Exercise the deployed UI against real API responses; repeat with fresh browser contexts."""
import argparse
import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright, expect

async def main(passes):
    root = Path(__file__).resolve().parents[1]
    errors = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for index in range(passes):
            context = await browser.new_context(viewport={"width": 1440, "height": 1000})
            page = await context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('response', lambda r: errors.append(f'{r.status} {r.url}') if r.status >= 400 and '/api/' in r.url else None)
            await page.goto('http://localhost:3000', wait_until='networkidle')
            await expect(page.get_by_role('heading', name='No active audit')).to_be_visible()
            await page.get_by_role('link', name='START NEW AUDIT', exact=True).click()
            async with page.expect_response(lambda r: r.request.method == 'POST' and '/api/v1/datasets' in r.url) as up:
                await page.locator('#file-upload').set_input_files(root / 'AuditGraph_Demo_SME_Ledger.xlsx')
            uploaded = await (await up.value).json()
            assert uploaded['row_count'] == 57
            async with page.expect_response(lambda r: r.request.method == 'POST' and r.url.endswith('/api/v1/audit-runs')) as run_resp:
                await page.get_by_role('button', name='ANALYZE LEDGER', exact=True).click()
            run = await (await run_resp.value).json()
            assert run['status'] == 'READY', run.get('degraded_reasons')
            await expect(page.get_by_text('Surfaced Findings', exact=False)).to_be_visible(timeout=30000)
            await expect(page.locator('#transactions')).to_contain_text('RT-001')
            cycle = next(c for c in run['cases'] if c.get('graph_payload'))
            row = page.get_by_role('row').filter(has_text=cycle['title']).first
            await row.get_by_role('button').click()
            await page.get_by_role('button', name='Generate Audit Actions', exact=True).click()
            await expect(page.get_by_text('Statutory Standards:', exact=False)).to_be_visible(timeout=15000)
            # Close the evidence drawer via its header control.
            await page.locator('.fixed.inset-0').get_by_role('button').first.click()
            await expect(page.get_by_text(re.compile(r'\(\d+ nodes, \d+ edges\)'))).to_be_visible(timeout=15000)
            await page.get_by_role('button', name='COPILOT', exact=True).click()
            await expect(page.get_by_text('Hello, I am your AuditGraph', exact=False)).to_be_visible(timeout=15000)
            async with page.expect_response(lambda r: r.request.method == 'POST' and r.url.endswith('/messages'), timeout=60000) as message:
                await page.get_by_role('button', name='Why is this risky?', exact=True).click()
            answer = await (await message.value).json()
            assert answer['run_id'] == run['run_id'] and answer['grounded'] and answer['answer']
            await page.get_by_title('Close Copilot Drawer').click()
            async with page.expect_popup() as report_popup:
                await page.get_by_role('link', name='REPORT', exact=True).click()
            report = await report_popup.value
            await report.wait_for_load_state()
            await expect(report.locator('body')).to_contain_text(run['run_id'])
            await expect(report.locator('body')).to_contain_text('Findings do not constitute a determination of fraud')
            await report.close()
            async with page.expect_download() as export:
                await page.get_by_role('link', name='CSV', exact=True).click()
            assert (await export.value).suggested_filename.endswith('.csv')
            await page.get_by_role('button', name='NEW AUDIT', exact=True).click()
            await expect(page.locator('#transactions')).to_have_count(0)
            await expect(page.get_by_role('link', name='REPORT', exact=True)).to_have_count(0)
            # A second ledger in the same tab must not inherit any run-A data.
            async with page.expect_response(lambda r: r.request.method == 'POST' and '/api/v1/datasets' in r.url):
                await page.locator('#file-upload').set_input_files({
                    'name': 'independent.csv', 'mimeType': 'text/csv',
                    'buffer': b'transaction_id,posting_date,amount,counterparty_name,invoice_number\nONLY-B1,2026-02-01,65000,Separate Company,IB\nONLY-B2,2026-02-01,65000,Separate Company,IB\n',
                })
            async with page.expect_response(lambda r: r.request.method == 'POST' and r.url.endswith('/api/v1/audit-runs')) as second:
                await page.get_by_role('button', name='ANALYZE LEDGER', exact=True).click()
            second_run = await (await second.value).json()
            assert second_run['run_id'] != run['run_id']
            await expect(page.locator('#transactions')).to_contain_text('ONLY-B1')
            await expect(page.locator('#transactions')).not_to_contain_text('RT-001')
            await expect(page.get_by_text(cycle['title'], exact=True)).to_have_count(0)
            await page.get_by_role('button', name='NEW AUDIT', exact=True).click()
            await page.goto('http://localhost:3000/about', wait_until='networkidle')
            await expect(page.get_by_text('Amrita Dube', exact=True)).to_be_visible()
            await page.goto('http://localhost:3000/system-health', wait_until='networkidle')
            await expect(page.get_by_text('Model 1.1.0', exact=False)).to_be_visible()
            await context.close()
            print(f'Browser pass {index+1}/{passes}: PASS', flush=True)
        await browser.close()
    assert not errors, errors
    print(json.dumps({'browser_passes': passes, 'critical_errors': errors}), flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--passes', type=int, default=10)
    asyncio.run(main(parser.parse_args().passes))

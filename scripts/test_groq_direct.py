import asyncio
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.copilot.providers.groq import GroqProvider


async def test_groq_direct():
    api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
    is_configured = bool(api_key.strip())

    print("==================================================")
    print(" AUDITGRAPH GROQ DIRECT API TEST")
    print("==================================================")
    print(f" Provider           : groq")
    print(f" Configured         : {is_configured}")

    if not is_configured:
        print(" Status             : NOT CONFIGURED (GROQ_API_KEY missing in .env)")
        print(" Fallback Active    : Deterministic Evidence Engine")
        print("==================================================")
        return False

    provider = GroqProvider()
    t0 = time.time()

    try:
        res = await provider.generate_response(
            session_id="test_session",
            run_id="test_run",
            user_message="Reply exactly: AUDITGRAPH GROQ ONLINE",
            system_context="You are AuditGraph AI Copilot. Output exact requested text.",
            tool_results=[],
            citations=[],
        )
        latency = (time.time() - t0) * 1000.0

        print(f" HTTP/API Success   : True")
        print(f" Latency            : {latency:.1f} ms")
        print(f" Model Used         : {provider.model}")
        print(f" Response Received  : {res.answer[:40]}")
        print("==================================================")
        return True

    except Exception as exc:
        print(f" HTTP/API Success   : False")
        print(f" Error Diagnostic   : {exc}")
        print("==================================================")
        return False


if __name__ == "__main__":
    asyncio.run(test_groq_direct())

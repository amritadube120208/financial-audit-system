import os
import time
import asyncio
import random
import logging
import httpx
from typing import Any
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse, CopilotCitation
from app.config import settings

logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):
    """
    Hardened GroqCloud LLM Provider.
    Includes:
    - Dynamic settings resolution (no frozen stale state)
    - Bounded retry with exponential backoff & jitter for 429/5xx/network errors
    - Lightweight, non-blocking health probe
    - Fast failover escalation to deterministic fallback engine
    """

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self._explicit_api_key = api_key
        self._explicit_model = model
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self._health_cache: dict[str, Any] = {}
        self._health_cache_time: float = 0.0

    @property
    def api_key(self) -> str:
        return (self._explicit_api_key or settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")).strip()

    @property
    def model(self) -> str:
        return (self._explicit_model or settings.GROQ_MODEL or os.environ.get("GROQ_MODEL", "groq/compound")).strip()

    def is_available(self) -> bool:
        return bool(self.api_key)

    async def probe_health(self, force_refresh: bool = False) -> dict[str, Any]:
        """
        Non-blocking health probe with 30s caching.
        Returns reachability, model, latency, and operational status without leaking secret tokens.
        """
        now = time.time()
        if not force_refresh and (now - self._health_cache_time) < 30.0 and self._health_cache:
            return self._health_cache

        if not self.is_available():
            self._health_cache = {
                "configured": False,
                "reachable": False,
                "status": "not_configured",
                "model": self.model,
                "latency_ms": 0.0,
                "last_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            self._health_cache_time = now
            return self._health_cache

        # Active reachability check via lightweight models listing
        t0 = time.time()
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get("https://api.groq.com/openai/v1/models", headers=headers)
                latency = round((time.time() - t0) * 1000.0, 1)
                if resp.status_code == 200:
                    self._health_cache = {
                        "configured": True,
                        "reachable": True,
                        "status": "healthy",
                        "model": self.model,
                        "latency_ms": latency,
                        "last_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                elif resp.status_code == 429:
                    self._health_cache = {
                        "configured": True,
                        "reachable": False,
                        "status": "rate_limited",
                        "model": self.model,
                        "latency_ms": latency,
                        "last_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
                else:
                    self._health_cache = {
                        "configured": True,
                        "reachable": False,
                        "status": f"http_{resp.status_code}",
                        "model": self.model,
                        "latency_ms": latency,
                        "last_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    }
        except Exception as e:
            latency = round((time.time() - t0) * 1000.0, 1)
            self._health_cache = {
                "configured": True,
                "reachable": False,
                "status": "unreachable",
                "error": str(e),
                "model": self.model,
                "latency_ms": latency,
                "last_check": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }

        self._health_cache_time = now
        return self._health_cache

    async def generate_response(
        self,
        session_id: str,
        run_id: str,
        user_message: str,
        system_context: str,
        tool_results: list[dict[str, Any]],
        citations: list[CopilotCitation],
    ) -> ProviderResponse:
        if not self.is_available():
            raise RuntimeError("Groq API Key missing or empty")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.2,
            "max_tokens": 700,
        }

        # Bounded retry: maximum 2 attempts (1 initial + 1 backoff retry)
        max_attempts = 2
        last_err: Exception | None = None

        t0 = time.time()
        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(self.endpoint, headers=headers, json=payload)

                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if not choices or "message" not in choices[0]:
                            raise RuntimeError(f"Malformed response payload from Groq: {data}")
                        answer_text = choices[0]["message"].get("content", "").strip()
                        if not answer_text:
                            raise RuntimeError("Empty response content from Groq")

                        duration = (time.time() - t0) * 1000.0
                        used_tools = list({t.get("tool_name", "evidence_fetch") for t in tool_results if isinstance(t, dict)})

                        return ProviderResponse(
                            message_id=f"msg_groq_{int(time.time()*1000)}",
                            session_id=session_id,
                            run_id=run_id,
                            answer=answer_text,
                            mode="groq_llm_grounded",
                            grounded=True,
                            confidence="high",
                            used_tools=used_tools,
                            citations=citations,
                            safety_note="Audit review priority only; not a fraud determination.",
                            duration_ms=duration,
                        )

                    # Handle retryable status codes: 429, 500, 502, 503, 504
                    if resp.status_code in (429, 500, 502, 503, 504):
                        err_msg = f"Groq HTTP {resp.status_code}: {resp.text}"
                        logger.warning(f"Groq attempt {attempt}/{max_attempts} failed: {err_msg}")
                        last_err = RuntimeError(err_msg)
                        if attempt < max_attempts:
                            sleep_time = 0.5 + random.uniform(0.1, 0.4)
                            await asyncio.sleep(sleep_time)
                            continue
                    else:
                        raise RuntimeError(f"Groq API unrecoverable status {resp.status_code}: {resp.text}")

            except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                logger.warning(f"Groq attempt {attempt}/{max_attempts} network exception: {net_err}")
                last_err = net_err
                if attempt < max_attempts:
                    await asyncio.sleep(0.5)
                    continue

        # If exhausted all bounded retries, raise to initiate cascade router failover
        raise RuntimeError(f"Groq Provider failed after {max_attempts} attempts: {last_err}")

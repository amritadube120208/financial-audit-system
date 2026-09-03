import os
import time
import httpx
from typing import Any
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse, CopilotCitation


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API Provider."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
        self.model = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def is_available(self) -> bool:
        return bool(self.api_key.strip())

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
            raise RuntimeError("OpenAI API Key missing")

        t0 = time.time()
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_context},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.1,
            "max_tokens": 600,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(self.endpoint, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"OpenAI API returned status {resp.status_code}: {resp.text}")

            data = resp.json()
            answer_text = data["choices"][0]["message"]["content"]

        duration = (time.time() - t0) * 1000.0
        used_tools = list({t.get("tool_name", "evidence_fetch") for t in tool_results})

        return ProviderResponse(
            message_id=f"msg_openai_{int(time.time()*1000)}",
            session_id=session_id,
            run_id=run_id,
            answer=answer_text.strip(),
            mode="openai_llm_grounded",
            grounded=True,
            confidence="high",
            used_tools=used_tools,
            citations=citations,
            safety_note="Audit review priority only; not a fraud determination.",
            duration_ms=duration,
        )

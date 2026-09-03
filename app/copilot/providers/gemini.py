import os
import time
import httpx
from typing import Any
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse, CopilotCitation


class GeminiProvider(BaseLLMProvider):
    """Google Gemini Developer API LLM Provider."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model = model or os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

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
            raise RuntimeError("Gemini API Key missing")

        t0 = time.time()
        url = f"{self.endpoint}?key={self.api_key}"

        prompt = f"{system_context}\n\nUser Question: {user_message}\n\nGenerate a concise, evidence-backed answer strictly using the provided context."

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 600},
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Gemini API returned status {resp.status_code}: {resp.text}")

            data = resp.json()
            answer_text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "Unable to generate answer.")
            )

        duration = (time.time() - t0) * 1000.0
        used_tools = list({t.get("tool_name", "evidence_fetch") for t in tool_results})

        return ProviderResponse(
            message_id=f"msg_gemini_{int(time.time()*1000)}",
            session_id=session_id,
            run_id=run_id,
            answer=answer_text.strip(),
            mode="gemini_llm_grounded",
            grounded=True,
            confidence="high",
            used_tools=used_tools,
            citations=citations,
            safety_note="Audit review priority only; not a fraud determination.",
            duration_ms=duration,
        )

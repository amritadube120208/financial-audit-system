import json
import httpx
from typing import Any
from app.config import settings
from app.copilot.providers.base import BaseLLMProvider, ProviderResponse
from app.copilot.schemas import CopilotCitation, CopilotFollowUpAction


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str | None = None, model: str = "gpt-4o"):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model

    async def generate(
        self,
        user_message: str,
        system_prompt: str,
        tool_results: list[dict[str, Any]],
        context_data: dict[str, Any],
        temperature: float = 0.1,
    ) -> ProviderResponse:
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": f"User Prompt: {user_message}\n\nRetrieved Ledger Tool Data:\n{json.dumps(tool_results, indent=2)}",
                },
            ],
            "temperature": temperature,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            answer_text = data["choices"][0]["message"]["content"]

        # Build citations from tool results
        citations = []
        for tr in tool_results:
            tool_name = tr.get("tool_name")
            output = tr.get("result", {})
            if isinstance(output, dict) and "case_id" in output:
                citations.append(
                    CopilotCitation(
                        source_type="investigation",
                        source_id=output["case_id"],
                        field="risk_score",
                        value=output.get("risk_score", 0.0),
                    )
                )

        return ProviderResponse(
            answer=answer_text,
            mode="llm_grounded",
            grounded=True,
            confidence="high",
            used_tools=[tr.get("tool_name") for tr in tool_results if tr.get("tool_name")],
            citations=citations,
        )

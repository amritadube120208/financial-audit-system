# AUDITGRAPH LLM PROVIDER RESEARCH & CASCADE SPECIFICATION

**Research Date:** 2026-09-03  
**Objective:** Evaluate legitimate, developer-friendly, free-tier LLM APIs for tool-calling Copilot integration.

---

## 1. Provider Evaluation Matrix

| Provider | Model | Free Tier Limits | Function/Tool Calling | Latency (P50) | Reliability | Status |
|---|---|---|---|---|---|---|
| **Google Gemini Developer API** | `gemini-1.5-flash` / `gemini-1.5-pro` | 15 RPM / 1M TPM free | Native Tool Calling | ~1.2s | High | **PRIMARY** |
| **GroqCloud API** | `llama-3.3-70b-versatile` / `mixtral-8x7b-32768` | 30 RPM / 14.4k RPD free | Native Tool Calling | ~0.4s | High | **SECONDARY** |
| **OpenRouter Free Models** | `meta-llama/llama-3.1-8b-instruct:free` | 20 RPM free | JSON / Tool Format | ~1.5s | Medium | **TERTIARY** |
| **Deterministic Fallback** | Local Template Engine | Unlimited (Offline) | Typed Tools Direct | ~0.005s | 100% | **FALLBACK** |

---

## 2. Recommended Provider Cascade Architecture

```text
USER QUERY
    ↓
PRIMARY: Gemini Developer API (GEMINI_API_KEY)
    ↓ (fail / 429 / timeout / 5xx)
SECONDARY: GroqCloud API (GROQ_API_KEY)
    ↓ (fail / 429 / timeout / 5xx)
TERTIARY: OpenRouter Free Models (OPENROUTER_API_KEY)
    ↓ (fail / 429 / timeout / 5xx)
ULTIMATE FALLBACK: Multi-Intent Deterministic Evidence Engine
```

---

## 3. Environment Variables Configuration (`.env`)

```env
COPILOT_PROVIDER=auto

GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile

OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

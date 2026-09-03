import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Environment
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    # Infrastructure & Persistence
    DATABASE_URL: str = "sqlite+aiosqlite:///./auditgraph.db"
    DUCKDB_PATH: str = "./data/auditgraph.duckdb"
    DATA_DIR: str = "./data"
    RECOVERY_DIR: str = "./data/recovery"

    # Pipeline Versioning & Deadlines
    PIPELINE_VERSION: str = "stage-v1.0.0+3f91c6a"
    SCORING_CONFIG_VERSION: str = "risk-v1"
    MAX_UPLOAD_MB: int = 100
    GLOBAL_ANALYSIS_DEADLINE_MS: int = 8000

    # Detector Timeout Controls (in Milliseconds)
    RULES_TIMEOUT_MS: int = 2000
    ML_TIMEOUT_MS: int = 2500
    GRAPH_TIMEOUT_MS: int = 2500
    GST_TIMEOUT_MS: int = 2000

    # Redis Config
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_OPTIONAL: bool = True

    # AI Audit Copilot
    COPILOT_ENABLED: bool = True
    COPILOT_PROVIDER: str = "configured_provider"
    COPILOT_MODEL: str = "gemini-3.6-flash"
    COPILOT_TIMEOUT_MS: int = 3000
    COPILOT_MAX_TOOL_CALLS: int = 6
    COPILOT_MAX_CONTEXT_TOKENS: int = 8000
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # Stage & Resilience Controls
    STAGE_MODE: bool = False
    STAGE_DISABLE_LLM: bool = False

    # Failure Injection Flags
    DEMO_FAIL_LLM: int = 0
    DEMO_FAIL_GRAPH: int = 0
    DEMO_FAIL_REDIS: int = 0
    DEMO_FORCE_TIMEOUT: int = 0
    DEMO_FORCE_SSE_FAILURE: int = 0


settings = Settings()

# Ensure directories exist
Path(settings.DATA_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.RECOVERY_DIR).mkdir(parents=True, exist_ok=True)
Path(os.path.dirname(settings.DUCKDB_PATH)).mkdir(parents=True, exist_ok=True)

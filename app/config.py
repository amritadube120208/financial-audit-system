from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = "development"
    APP_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    DATABASE_URL: str = "sqlite+aiosqlite:///./auditgraph.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    PIPELINE_VERSION: str = "1.0.0"
    SCORING_CONFIG_VERSION: str = "1.0.0"
    DETECTOR_CONFIG_VERSION: str = "1.0.0"

    DETECTOR_TIMEOUT_MS: int = 4000
    GLOBAL_ANALYSIS_DEADLINE_MS: int = 15000
    GLOBAL_PIPELINE_DEADLINE_MS: int = 15000

    MATERIALITY_THRESHOLD: float = 500000.0

    COPILOT_PROVIDER: str = "fallback"
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    RECOVERY_DIR: str = "data/recovery"

    DISABLE_LLM: bool = False
    DEMO_FAIL_LLM: int = 0
    DEMO_FAIL_GRAPH: int = 0
    DEMO_FAIL_ML: int = 0
    DEMO_FAIL_REDIS: int = 0
    DEMO_FORCE_TIMEOUT: int = 0
    DEMO_FORCE_SSE_FAILURE: int = 0


settings = Settings()

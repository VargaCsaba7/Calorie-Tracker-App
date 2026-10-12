from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from environment variables or a .env file."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Workout & Macro Tracker API"
    # XAMPP default: user "root" with an empty password
    database_url: str = "mysql+pymysql://root:@localhost:3306/calorie_tracker?charset=utf8mb4"

    # JWT settings (used in Phase 2)
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    cors_origins: list[str] = ["http://localhost:5173"]

    # AI meal estimate (optional). "ollama" runs a free model locally; "anthropic" uses Claude.
    ai_provider: Literal["ollama", "anthropic"] = "ollama"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-opus-5-5"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

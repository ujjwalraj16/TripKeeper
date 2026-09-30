"""
core/config.py — Application-wide settings loaded from .env
Uses pydantic-settings so every value is type-checked at startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Database
    database_url: str = "sqlite+aiosqlite:///./tripkeeper.db"

    # Ollama (AI)
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5:7b"

    # CORS — stored as a comma-separated string, parsed into a list below
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Split the comma-separated CORS_ORIGINS string into a list."""
        return [o.strip() for o in self.cors_origins.split(",")]

    # Tell pydantic-settings to read from the .env file in the backend/ dir
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


# Singleton — import this wherever you need settings
settings = Settings()

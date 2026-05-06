"""Конфигурация приложения через переменные окружения.

Все значения читаются из окружения с разумными дефолтами.
В docker-compose значения подставляются из .env файла в корне проекта.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Настройки(BaseSettings):
    """Все настройки приложения в одном объекте."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # === Окружение ===
    окружение: str = Field("development", alias="ENV")
    уровень_логов: str = Field("INFO", alias="LOG_LEVEL")

    # === База данных ===
    database_url: str = Field(
        "postgresql+asyncpg://edm:edm@postgres:5432/edm",
        alias="DATABASE_URL",
    )

    # === OpenRouter ===
    openrouter_api_key: str = Field("", alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(
        "https://openrouter.ai/api/v1",
        alias="OPENROUTER_BASE_URL",
    )

    # === Модели LLM ===
    llm_модель_извлечения: str = Field(
        "anthropic/claude-sonnet-4.5",
        alias="LLM_MODEL_EXTRACTION",
    )
    llm_модель_поиска: str = Field(
        "anthropic/claude-sonnet-4.5",
        alias="LLM_MODEL_SEARCH",
    )
    llm_модель_задержек: str = Field(
        "anthropic/claude-sonnet-4.5",
        alias="LLM_MODEL_DELAYS",
    )
    llm_модель_аудита: str = Field(
        "anthropic/claude-sonnet-4.5",
        alias="LLM_MODEL_AUDIT",
    )
    llm_модель_сравнения: str = Field(
        "anthropic/claude-opus-4.6",
        alias="LLM_MODEL_COMPARISON",
    )
    llm_модель_эмбеддингов: str = Field(
        "openai/text-embedding-3-small",
        alias="LLM_MODEL_EMBEDDINGS",
    )


# Единственный экземпляр настроек на всё приложение.
# Импортируется в код через `from app.общее.конфиг import настройки`.
настройки = Настройки()

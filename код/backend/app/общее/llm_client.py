"""LLM-клиент для OpenRouter.

Единственная точка вызова LLM во всём приложении.
Модули НЕ импортируют openai напрямую — только этот модуль.
"""

import structlog
from openai import AsyncOpenAI

from app.общее.конфиг import настройки

логгер = structlog.get_logger()

_клиент = AsyncOpenAI(
    api_key=настройки.openrouter_api_key,
    base_url=настройки.openrouter_base_url,
)


async def вызвать_llm(
    сообщения: list[dict],
    модель: str | None = None,
    таймаут: float = 60.0,
) -> str:
    """Вызывает LLM через OpenRouter, возвращает текст ответа.

    Args:
        сообщения: список {role, content} в формате OpenAI chat
        модель: идентификатор модели OpenRouter (по умолчанию — модель извлечения)
        таймаут: максимальное время ожидания в секундах

    Raises:
        Exception: пробрасывает ошибки OpenRouter — обработка в вызывающем коде
    """
    используемая_модель = модель or настройки.llm_модель_извлечения
    логгер.debug("llm_вызов", модель=используемая_модель, сообщений=len(сообщения))
    ответ = await _клиент.chat.completions.create(
        model=используемая_модель,
        messages=сообщения,
        timeout=таймаут,
    )
    текст = ответ.choices[0].message.content or ""
    логгер.debug("llm_ответ_получен", символов=len(текст))
    return текст


async def получить_эмбеддинг(текст: str) -> list[float]:
    """Возвращает вектор размерности 1536 для переданного текста.

    Текст обрезается до 8000 символов — достаточно для документов закупок.

    Raises:
        Exception: пробрасывает ошибки OpenRouter — обработка в вызывающем коде
    """
    усечённый = текст[:8000]
    логгер.debug("эмбеддинг_запрос", символов=len(усечённый))
    ответ = await _клиент.embeddings.create(
        model=настройки.llm_модель_эмбеддингов,
        input=усечённый,
    )
    return ответ.data[0].embedding

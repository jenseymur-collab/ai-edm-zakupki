"""Health-check эндпоинты."""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.общее.база_данных import получить_сессию
from app.общее.конфиг import настройки
from app.общее.llm_client import вызвать_llm

роутер_здоровья = APIRouter()


class СтатусЗдоровья(BaseModel):
    статус: Literal["ok", "degraded", "error"] = Field(..., description="Общий статус сервиса")
    версия: str = Field(..., description="Версия приложения")
    окружение: str = Field(..., description="Имя окружения")
    время: datetime = Field(..., description="Время ответа сервера в UTC")


class СтатусБД(BaseModel):
    статус: Literal["ok", "error"]
    сообщение: str


class СтатусLLM(BaseModel):
    статус: Literal["ok", "error"]
    сообщение: str


@роутер_здоровья.get("", response_model=СтатусЗдоровья, summary="Базовая проверка здоровья")
async def проверить_здоровье() -> СтатусЗдоровья:
    """Возвращает базовый статус сервиса без проверки внешних зависимостей."""
    return СтатусЗдоровья(
        статус="ok",
        версия="0.1.0",
        окружение=настройки.окружение,
        время=datetime.now(timezone.utc),
    )


@роутер_здоровья.get("/db", response_model=СтатусБД, summary="Проверка соединения с БД")
async def проверить_бд(сессия: AsyncSession = Depends(получить_сессию)) -> СтатусБД:
    """Выполняет SELECT 1 к Postgres. Возвращает ok или error."""
    try:
        await сессия.execute(text("SELECT 1"))
        return СтатусБД(статус="ok", сообщение="Postgres доступен")
    except Exception as е:
        return СтатусБД(статус="error", сообщение=str(е))


@роутер_здоровья.get("/llm", response_model=СтатусLLM, summary="Проверка соединения с LLM")
async def проверить_llm() -> СтатусLLM:
    """Отправляет короткий ping-запрос в OpenRouter. Возвращает ok или error."""
    try:
        await вызвать_llm(
            сообщения=[{"role": "user", "content": "Ответь одним словом: ping"}],
            таймаут=15.0,
        )
        return СтатусLLM(статус="ok", сообщение="OpenRouter доступен")
    except Exception as е:
        return СтатусLLM(статус="error", сообщение=str(е))

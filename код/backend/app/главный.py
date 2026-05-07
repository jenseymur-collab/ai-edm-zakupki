"""Точка входа FastAPI приложения."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import регистрировать_роуты
from app.общее.база_данных import Основа, движок
from app.общее.конфиг import настройки
from app.общее.логирование import настроить_логирование

# Импортируем все модели, чтобы они зарегистрировались в Основа.metadata
import app.модули.пользователи.модели  # noqa: F401
import app.модули.сделки.модели  # noqa: F401
import app.модули.документы.модели  # noqa: F401
import app.модули.согласование.модели  # noqa: F401
import app.модули.аудит.модели  # noqa: F401

логгер = настроить_логирование(уровень=настройки.уровень_логов)

# Postgres-схемы, которые нужно создать до таблиц
СХЕМЫ = ["пользователи", "сделки", "документы", "согласование", "аудит"]


@asynccontextmanager
async def жизненный_цикл(приложение_arg: FastAPI) -> AsyncIterator[None]:
    """Управляет startup/shutdown событиями приложения."""
    логгер.info("приложение_стартует", окружение=настройки.окружение, версия=приложение_arg.version)

    # Создаём расширение pgvector, схемы и все таблицы
    async with движок.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        for схема in СХЕМЫ:
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{схема}"'))
        await conn.run_sync(Основа.metadata.create_all)

    логгер.info("база_данных_готова", схем=len(СХЕМЫ))
    yield

    await движок.dispose()
    логгер.info("приложение_остановлено")


приложение = FastAPI(
    title="AI-EDM Закупки",
    version="0.1.0",
    description="MVP AI-системы электронного документооборота закупок",
    lifespan=жизненный_цикл,
)

приложение.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://earnest-playfulness-production-7b37.up.railway.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

регистрировать_роуты(приложение)

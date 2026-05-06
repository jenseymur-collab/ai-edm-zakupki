"""Подключение к базе данных: движок, сессия, базовый класс моделей."""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.общее.конфиг import настройки


class Основа(DeclarativeBase):
    """Базовый класс для всех SQLAlchemy-моделей приложения."""

    pass


движок = create_async_engine(
    настройки.database_url,
    echo=False,
    pool_pre_ping=True,  # проверяет соединение перед каждым запросом
    pool_size=5,
    max_overflow=10,
)

фабрика_сессий = async_sessionmaker(движок, expire_on_commit=False)


async def получить_сессию() -> AsyncIterator[AsyncSession]:
    """FastAPI Dependency — открывает сессию БД на время запроса."""
    async with фабрика_сессий() as сессия:
        yield сессия

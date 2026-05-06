"""HTTP API: регистрация всех роутеров приложения."""

from fastapi import FastAPI

from app.api.здоровье import роутер_здоровья
from app.api.ai_роутер import роутер as роутер_ai
from app.модули.сделки.роутер import роутер as роутер_сделок
from app.модули.документы.роутер import роутер as роутер_документов
from app.модули.согласование.роутер import роутер as роутер_согласования


def регистрировать_роуты(приложение: FastAPI) -> None:
    """Подключает все роутеры приложения.

    Вызывается один раз при старте из app/главный.py.
    """
    приложение.include_router(роутер_здоровья, prefix="/health", tags=["здоровье"])
    приложение.include_router(роутер_сделок, prefix="/deals", tags=["сделки"])
    приложение.include_router(роутер_документов, tags=["документы"])
    приложение.include_router(роутер_согласования, tags=["согласование"])
    приложение.include_router(роутер_ai, tags=["AI"])

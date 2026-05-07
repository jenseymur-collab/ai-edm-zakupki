"""AI-роутер: эндпоинты LLM-функций (извлечение, поиск, полнота, задержки, сравнение)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.общее.база_данных import получить_сессию
from app.модули.документы.модели import Документ
from app.модули.документы.сервисы.извлечение import извлечь_поля
from app.модули.документы.сервисы.поиск import семантический_поиск
from app.модули.документы.сервисы.сравнение import сравнить_версии
from app.модули.документы.сервисы.эмбеддинги import backfill_эмбеддингов
from app.модули.сделки.модели import Сделка
from app.модули.сделки.сервисы.задержки import проанализировать_задержки
from app.модули.сделки.сервисы.проверка import проверить_полноту

роутер = APIRouter(prefix="/ai", tags=["AI"])


# ── Схемы запросов/ответов (простые, прямо здесь) ────────────────────────────

class ЗапросПоиска(BaseModel):
    запрос: str
    топ: int = 5


class ЗапросСравнения(BaseModel):
    документ_1_id: uuid.UUID
    документ_2_id: uuid.UUID


class ОтветИзвлечения(BaseModel):
    документ_id: uuid.UUID
    поля: dict
    модель: str
    схема_версия: str


class ОтветПолноты(BaseModel):
    сделка_id: uuid.UUID
    полный: bool
    анализ: str
    есть: list[str]
    отсутствуют: list[str]
    чеклист: list[str]


class ОтветЗадержек(BaseModel):
    сделка_id: uuid.UUID
    просрочено: int
    под_угрозой: int
    анализ: str
    визы_детали: list[dict]


class ОтветСравнения(BaseModel):
    документ_1_id: uuid.UUID
    документ_2_id: uuid.UUID
    тип: str
    номер: str | None
    версия_1: int
    версия_2: int
    анализ: str


class РезультатПоиска(BaseModel):
    результаты: list[dict]
    запрос: str
    найдено: int


class ОтветBackfill(BaseModel):
    обработано: int
    успешно: int
    ошибки: int


# ── Эндпоинты ─────────────────────────────────────────────────────────────────

@роутер.post("/documents/{doc_id}/extract",
             response_model=ОтветИзвлечения,
             summary="Извлечь поля из документа (LLM)")
async def извлечь_поля_эндпоинт(
    doc_id: uuid.UUID,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    LLM извлекает структурированные поля из текста документа.
    Результат сохраняется в ExtractedFields и возвращается в ответе.
    """
    документ = await сессия.get(Документ, doc_id)
    if not документ:
        raise HTTPException(status_code=404, detail="Документ не найден")

    результат = await извлечь_поля(документ, сессия)
    return ОтветИзвлечения(
        документ_id=doc_id,
        поля=результат.поля,
        модель=результат.модель_использована,
        схема_версия=результат.схема_версия,
    )


@роутер.post("/search",
             response_model=РезультатПоиска,
             summary="Семантический поиск по документам (pgvector)")
async def семантический_поиск_эндпоинт(
    данные: ЗапросПоиска,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    Семантический поиск по эмбеддингам документов.
    Возвращает top-N наиболее похожих документов (cosine similarity).
    """
    результаты = await семантический_поиск(данные.запрос, сессия, топ=данные.топ)
    return РезультатПоиска(
        результаты=результаты,
        запрос=данные.запрос,
        найдено=len(результаты),
    )


@роутер.get("/deals/{deal_id}/completeness",
            response_model=ОтветПолноты,
            summary="Проверка полноты пакета документов (LLM)")
async def проверка_полноты_эндпоинт(
    deal_id: uuid.UUID,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    LLM проверяет, все ли требуемые документы загружены для сделки.
    Чеклист зависит от профиля сделки (стандарт / малая_закупка).
    """
    сделка = await сессия.get(Сделка, deal_id)
    if not сделка:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    результат = await проверить_полноту(сделка, сессия)
    return ОтветПолноты(
        сделка_id=deal_id,
        **результат,
    )


@роутер.get("/deals/{deal_id}/delays",
            response_model=ОтветЗадержек,
            summary="Анализ задержек и рисков согласования (LLM)")
async def анализ_задержек_эндпоинт(
    deal_id: uuid.UUID,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    LLM анализирует все визы сделки: просрочки, угрозы, рекомендации.
    """
    сделка = await сессия.get(Сделка, deal_id)
    if not сделка:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    результат = await проанализировать_задержки(сделка, сессия)
    return ОтветЗадержек(
        сделка_id=deal_id,
        **результат,
    )


@роутер.post("/embeddings/backfill",
             response_model=ОтветBackfill,
             summary="Создать эмбеддинги для документов без вектора (backfill)")
async def backfill_эмбеддингов_эндпоинт(
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    Проходит по всем **активным** документам без эмбеддинга и генерирует векторы.

    Используется для:
    - починки поиска после первого `seed.py`
    - восстановления после сбоя при загрузке

    ⚠️ Время выполнения: ~2–3 сек на документ (вызов OpenRouter).
    Для 9 документов без эмбеддинга ≈ 20–30 сек.
    """
    результат = await backfill_эмбеддингов(сессия)
    return ОтветBackfill(**результат)


@роутер.post("/documents/compare",
             response_model=ОтветСравнения,
             summary="Сравнить две версии документа (LLM)")
async def сравнение_документов_эндпоинт(
    данные: ЗапросСравнения,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """
    LLM сравнивает два документа, выявляет изменения и оценивает риски.
    """
    д1 = await сессия.get(Документ, данные.документ_1_id)
    д2 = await сессия.get(Документ, данные.документ_2_id)
    if not д1:
        raise HTTPException(status_code=404, detail=f"Документ {данные.документ_1_id} не найден")
    if not д2:
        raise HTTPException(status_code=404, detail=f"Документ {данные.документ_2_id} не найден")

    результат = await сравнить_версии(д1, д2, сессия)
    return ОтветСравнения(**результат)


# ── Admin: seed ───────────────────────────────────────────────────────────────

@роутер.post("/admin/seed", tags=["Admin"])
async def запустить_seed():
    """Залить демо-данные (один раз). Повторный вызов безопасен — пропустит если данные есть."""
    try:
        import sys, os
        sys.path.insert(0, "/app")
        from seed import main
        await main()
        return {"статус": "ok", "сообщение": "Seed выполнен успешно"}
    except Exception as е:
        raise HTTPException(status_code=500, detail=str(е))

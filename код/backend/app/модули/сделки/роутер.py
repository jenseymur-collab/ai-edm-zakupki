"""Роутер сделок: список, карточка, дашборд."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.общее.база_данных import получить_сессию
from app.модули.аудит.модели import Событие
from app.модули.документы.модели import Документ
from app.модули.согласование.модели import Виза
from app.модули.сделки.модели import Поставщик, Сделка
from app.модули.сделки.схемы import (
    ДашбордОтвет,
    СделкаКраткая,
    СделкаПодробно,
    СписокСделок,
    ПоставщикОтвет,
)

роутер = APIRouter()


@роутер.get("", response_model=СписокСделок, summary="Список сделок")
async def список_сделок(
    страница: int = Query(1, ge=1),
    размер: int = Query(20, ge=1, le=100),
    статус: str | None = Query(None),
    сессия: AsyncSession = Depends(получить_сессию),
):
    """Возвращает пагинированный список сделок."""
    запрос = select(Сделка).order_by(Сделка.создана.desc())
    if статус:
        запрос = запрос.where(Сделка.статус == статус)

    # Общее кол-во
    запрос_счёт = select(func.count()).select_from(запрос.subquery())
    всего = (await сессия.execute(запрос_счёт)).scalar_one()

    # Страница
    запрос = запрос.offset((страница - 1) * размер).limit(размер)
    строки = (await сессия.execute(запрос)).scalars().all()

    return СписокСделок(
        данные=[СделкаКраткая.model_validate(с) for с in строки],
        всего=всего,
        страница=страница,
        размер=размер,
    )


@роутер.get("/dashboard", response_model=ДашбордОтвет, summary="Дашборд")
async def дашборд(сессия: AsyncSession = Depends(получить_сессию)):
    """Агрегированная статистика: сделки по статусам, просрочки, события."""
    сейчас = datetime.now(timezone.utc)

    # Сделки по статусам
    рез_статусы = await сессия.execute(
        select(Сделка.статус, func.count().label("кол"))
        .group_by(Сделка.статус)
    )
    сделки_по_статусам = {строка.статус: строка.кол for строка in рез_статусы}
    всего_сделок = sum(сделки_по_статусам.values())
    активных = сделки_по_статусам.get("в_работе", 0)

    # Просроченные открытые визы
    просрочено = (await сессия.execute(
        select(func.count()).where(
            Виза.решение.is_(None),
            Виза.дедлайн < сейчас,
        )
    )).scalar_one()

    # Последние 10 событий
    события_строки = (await сессия.execute(
        select(Событие).order_by(Событие.создано.desc()).limit(10)
    )).scalars().all()
    последние_события = [
        {
            "id": str(с.id),
            "тип": с.тип,
            "сущность_тип": с.сущность_тип,
            "сущность_id": str(с.сущность_id),
            "создано": с.создано.isoformat() if с.создано else None,
        }
        for с in события_строки
    ]

    return ДашбордОтвет(
        сделки_по_статусам=сделки_по_статусам,
        просрочено_виз=просрочено,
        всего_сделок=всего_сделок,
        активных_сделок=активных,
        последние_события=последние_события,
    )


@роутер.get("/{deal_id}", response_model=СделкаПодробно, summary="Карточка сделки")
async def карточка_сделки(
    deal_id: uuid.UUID,
    сессия: AsyncSession = Depends(получить_сессию),
):
    """Карточка сделки с поставщиком, счётчиками документов и виз."""
    сейчас = datetime.now(timezone.utc)

    сделка = await сессия.get(Сделка, deal_id)
    if not сделка:
        raise HTTPException(status_code=404, detail="Сделка не найдена")

    поставщик = await сессия.get(Поставщик, сделка.поставщик_id)

    # Счётчики документов
    документов_всего = (await сессия.execute(
        select(func.count()).where(Документ.сделка_id == deal_id)
    )).scalar_one()

    документов_на_согл = (await сессия.execute(
        select(func.count()).where(
            Документ.сделка_id == deal_id,
            Документ.статус == "на_согласовании",
        )
    )).scalar_one()

    # Просроченных виз по документам сделки
    uid_документов = (await сессия.execute(
        select(Документ.id).where(Документ.сделка_id == deal_id)
    )).scalars().all()

    просрочено_виз = 0
    if uid_документов:
        просрочено_виз = (await сессия.execute(
            select(func.count()).where(
                Виза.документ_id.in_(uid_документов),
                Виза.решение.is_(None),
                Виза.дедлайн < сейчас,
            )
        )).scalar_one()

    ответ = СделкаПодробно.model_validate(сделка)
    if поставщик:
        ответ.поставщик = ПоставщикОтвет.model_validate(поставщик)
    ответ.документов_всего = документов_всего
    ответ.документов_на_согласовании = документов_на_согл
    ответ.просрочено_виз = просрочено_виз
    return ответ

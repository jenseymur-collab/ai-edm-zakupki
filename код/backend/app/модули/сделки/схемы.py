"""Pydantic-схемы для модуля Сделки."""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ПоставщикОтвет(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    название: str
    инн: str
    страна: str
    контакт_email: str | None = None


class СделкаКраткая(BaseModel):
    """Строка в списке сделок."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    номер: str
    название: str
    профиль: str
    статус: str
    сумма: Decimal | None = None
    валюта: str
    поставщик_id: uuid.UUID
    ответственный_id: uuid.UUID
    создана: datetime
    обновлена: datetime


class СделкаПодробно(BaseModel):
    """Карточка сделки с документами и статусом согласования."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    номер: str
    название: str
    профиль: str
    статус: str
    сумма: Decimal | None = None
    валюта: str
    поставщик_id: uuid.UUID
    ответственный_id: uuid.UUID
    создана: datetime
    обновлена: datetime
    # Расширенные поля — заполняются в роутере
    поставщик: ПоставщикОтвет | None = None
    документов_всего: int = 0
    документов_на_согласовании: int = 0
    просрочено_виз: int = 0


class СписокСделок(BaseModel):
    """Пагинированный список сделок."""
    данные: list[СделкаКраткая]
    всего: int
    страница: int
    размер: int


class ДашбордОтвет(BaseModel):
    """Агрегированная статистика для дашборда."""
    сделки_по_статусам: dict[str, int]
    просрочено_виз: int
    всего_сделок: int
    активных_сделок: int
    последние_события: list[dict]

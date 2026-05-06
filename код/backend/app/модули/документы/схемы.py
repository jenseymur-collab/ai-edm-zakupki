"""Pydantic-схемы для модуля Документы."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ДокументЗагрузка(BaseModel):
    """Тело запроса при загрузке нового документа."""
    тип: str
    номер: str | None = None
    текст: str
    загружен_кем: uuid.UUID  # MVP: передаём явно, без сессии


class ДокументКраткий(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    сделка_id: uuid.UUID
    тип: str
    номер: str | None = None
    версия: int
    активная: bool
    статус: str
    загружен_когда: datetime


class ИзвлечённыеПоля(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    документ_id: uuid.UUID
    поля: dict
    модель_использована: str
    схема_версия: str
    извлечено_когда: datetime


class ДокументПодробно(BaseModel):
    """Документ со всеми данными включая AI-поля."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    сделка_id: uuid.UUID
    тип: str
    номер: str | None = None
    версия: int
    родитель_id: uuid.UUID | None = None
    активная: bool
    статус: str
    текст: str
    источник: str
    загружен_кем: uuid.UUID
    загружен_когда: datetime
    извлечённые_поля: ИзвлечённыеПоля | None = None
    есть_эмбеддинг: bool = False

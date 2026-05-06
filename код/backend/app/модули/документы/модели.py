"""Модели схемы `документы`."""

import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, Integer, String, Text, TIMESTAMP, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.общее.база_данных import Основа

# Типы документов (7 по ТЗ)
ТИПЫ_ДОКУМЕНТОВ = (
    "заявка_на_закупку",
    "коммерческое_предложение",
    "протокол_выбора",
    "договор",
    "спецификация",
    "акт",
    "счёт_фактура",
)

# Статусы документа
СТАТУС_ЗАГРУЖЕН = "загружен"
СТАТУС_НА_СОГЛАСОВАНИИ = "на_согласовании"
СТАТУС_СОГЛАСОВАН = "согласован"
СТАТУС_ОТКЛОНЁН = "отклонён"
СТАТУС_АРХИВ = "архив"
СТАТУС_AI_ОЖИДАЕТ = "ai_ожидает_повтора"

# Источники
ИСТОЧНИК_WEB = "web_paste"
ИСТОЧНИК_API = "api"
ИСТОЧНИК_MIGRATION = "migration"


class Документ(Основа):
    """Документ закупки — основная единица хранения."""

    __tablename__ = "документы"
    __table_args__ = {"schema": "документы"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    сделка_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    тип: Mapped[str] = mapped_column(String(100), nullable=False)
    номер: Mapped[str | None] = mapped_column(String(100), nullable=True)
    версия: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    родитель_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    активная: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    статус: Mapped[str] = mapped_column(String(50), nullable=False, default=СТАТУС_ЗАГРУЖЕН)
    текст: Mapped[str] = mapped_column(Text, nullable=False)
    источник: Mapped[str] = mapped_column(String(50), nullable=False, default=ИСТОЧНИК_WEB)
    загружен_кем: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    загружен_когда: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )


class ExtractedFields(Основа):
    """Поля, извлечённые AI из текста документа."""

    __tablename__ = "extracted_fields"
    __table_args__ = {"schema": "документы"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    документ_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), nullable=False, unique=True
    )
    поля: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    модель_использована: Mapped[str] = mapped_column(String(200), nullable=False)
    схема_версия: Mapped[str] = mapped_column(String(20), nullable=False, default="v1")
    извлечено_когда: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )


class Эмбеддинг(Основа):
    """Векторное представление документа для семантического поиска."""

    __tablename__ = "эмбеддинги"
    __table_args__ = {"schema": "документы"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    документ_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), nullable=False, unique=True
    )
    вектор: Mapped[list] = mapped_column(Vector(1536), nullable=False)
    модель_использована: Mapped[str] = mapped_column(String(200), nullable=False)
    создан: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

"""Модели схемы `аудит`."""

import uuid
from datetime import datetime

from sqlalchemy import String, TIMESTAMP, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.общее.база_данных import Основа


class Событие(Основа):
    """Журнал аудита — append-only. Никогда не изменяется и не удаляется."""

    __tablename__ = "события"
    __table_args__ = {"schema": "аудит"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    тип: Mapped[str] = mapped_column(String(100), nullable=False)
    сущность_тип: Mapped[str] = mapped_column(String(50), nullable=False)
    сущность_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    пользователь_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    данные: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    создано: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

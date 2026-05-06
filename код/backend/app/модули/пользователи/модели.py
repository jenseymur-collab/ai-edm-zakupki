"""Модели схемы `пользователи`."""

import uuid
from datetime import datetime

from sqlalchemy import String, TIMESTAMP, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.общее.база_данных import Основа

# Роли: закупки / финансы / юрист / гд / аудитор
РОЛИ = ("закупки", "финансы", "юрист", "гд", "аудитор")


class Пользователь(Основа):
    """Пользователь системы. MVP — без авторизации, только справочник ролей."""

    __tablename__ = "пользователи"
    __table_args__ = {"schema": "пользователи"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    имя: Mapped[str] = mapped_column(String(255), nullable=False)
    роль: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    создан: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

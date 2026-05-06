"""Модели схемы `согласование`."""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, Text, TIMESTAMP, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.общее.база_данных import Основа

# Статусы маршрута (в целом)
МАРШРУТ_НЕ_НАЧАТ = "не_начат"
МАРШРУТ_В_РАБОТЕ = "в_работе"
МАРШРУТ_ЗАВЕРШЁН = "завершён"
МАРШРУТ_ОТОЗВАН = "отозван"

# Статусы шага
ШАГ_ОЖИДАЕТ = "ожидает"
ШАГ_АКТИВЕН = "активен"
ШАГ_ЗАКРЫТ = "закрыт"
ШАГ_ПРОПУЩЕН = "пропущен"

# Решения визы
РЕШЕНИЕ_СОГЛАСОВАНО = "согласовано"
РЕШЕНИЕ_ОТКЛОНЕНО = "отклонено"
РЕШЕНИЕ_НА_ДОРАБОТКУ = "на_доработку"


class МаршрутСогласования(Основа):
    """Шаблон маршрута согласования по типу документа и сумме."""

    __tablename__ = "approval_routes"
    __table_args__ = {"schema": "согласование"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    название: Mapped[str] = mapped_column(String(500), nullable=False)
    тип_документа: Mapped[str] = mapped_column(String(100), nullable=False)
    сумма_от: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    сумма_до: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    версия: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    активен: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    создан: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )


class ШагМаршрута(Основа):
    """Один шаг в маршруте согласования (роль + срок)."""

    __tablename__ = "approval_route_steps"
    __table_args__ = {"schema": "согласование"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    маршрут_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    порядок: Mapped[int] = mapped_column(Integer, nullable=False)
    роль: Mapped[str] = mapped_column(String(50), nullable=False)
    срок_дни: Mapped[int] = mapped_column(Integer, nullable=False)


class Виза(Основа):
    """Виза согласования — конкретный экземпляр шага для конкретного документа."""

    __tablename__ = "approvals"
    __table_args__ = {"schema": "согласование"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    документ_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    маршрут_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    маршрут_статус: Mapped[str] = mapped_column(
        String(50), nullable=False, default=МАРШРУТ_В_РАБОТЕ
    )
    шаг_маршрута_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    шаг_статус: Mapped[str] = mapped_column(String(50), nullable=False, default=ШАГ_ОЖИДАЕТ)
    пользователь_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    решение: Mapped[str | None] = mapped_column(String(50), nullable=True)
    комментарий: Mapped[str | None] = mapped_column(Text, nullable=True)
    создана: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    решено_когда: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    дедлайн: Mapped[datetime] = mapped_column(TIMESTAMP(timezone=True), nullable=False)

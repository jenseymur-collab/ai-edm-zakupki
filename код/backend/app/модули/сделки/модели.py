"""Модели схемы `сделки`."""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Numeric, String, TIMESTAMP, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.общее.база_данных import Основа

# Профили сделки (хардкод для MVP)
ПРОФИЛЬ_СТАНДАРТ = "стандарт"          # требует все 7 типов документов
ПРОФИЛЬ_МАЛАЯ = "малая_закупка"         # требует 5 типов (без протокол_выбора, спецификация)

# Статусы сделки
СТАТУС_ЧЕРНОВИК = "черновик"
СТАТУС_В_РАБОТЕ = "в_работе"
СТАТУС_ЗАКРЫТА = "закрыта"
СТАТУС_ОТМЕНЕНА = "отменена"


class Поставщик(Основа):
    """Поставщик — контрагент по закупке."""

    __tablename__ = "поставщики"
    __table_args__ = {"schema": "сделки"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    название: Mapped[str] = mapped_column(String(500), nullable=False)
    инн: Mapped[str] = mapped_column(String(12), nullable=False, unique=True)
    страна: Mapped[str] = mapped_column(String(3), nullable=False, default="RU")
    контакт_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    создан: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )


class Сделка(Основа):
    """Сделка — единая карточка закупки."""

    __tablename__ = "сделки"
    __table_args__ = {"schema": "сделки"}

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    номер: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    название: Mapped[str] = mapped_column(String(500), nullable=False)
    # Логические ссылки на другие схемы — без DB-level FK (per архитектура)
    поставщик_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    ответственный_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    профиль: Mapped[str] = mapped_column(String(50), nullable=False, default=ПРОФИЛЬ_СТАНДАРТ)
    статус: Mapped[str] = mapped_column(String(50), nullable=False, default=СТАТУС_В_РАБОТЕ)
    сумма: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    валюта: Mapped[str] = mapped_column(String(3), nullable=False, default="RUB")
    создана: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    обновлена: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

"""Pydantic-схемы для модуля Согласование."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ВизаОтвет(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    документ_id: uuid.UUID
    маршрут_id: uuid.UUID
    маршрут_статус: str
    шаг_маршрута_id: uuid.UUID
    шаг_статус: str
    пользователь_id: uuid.UUID | None = None
    решение: str | None = None
    комментарий: str | None = None
    дедлайн: datetime
    решено_когда: datetime | None = None
    # Вычислимые поля (заполняются в роутере)
    просрочена: bool = False
    роль_шага: str | None = None
    порядок_шага: int | None = None


class ЦепочкаСогласования(BaseModel):
    """Полная цепочка виз для документа."""
    документ_id: uuid.UUID
    маршрут_название: str | None = None
    визы: list[ВизаОтвет]
    текущий_шаг: int | None = None
    завершено: bool = False


class ЗапросВизы(BaseModel):
    """Тело запроса при визировании документа."""
    пользователь_id: uuid.UUID
    решение: str          # "согласовано" / "отклонено" / "на_доработку"
    комментарий: str | None = None


class ОтветВизирования(BaseModel):
    """Результат операции визирования."""
    виза_id: uuid.UUID
    решение: str
    следующий_шаг: int | None = None   # None = маршрут закрыт
    маршрут_завершён: bool = False
    сообщение: str

"""Структурное JSON-логирование через structlog.

Все логи в едином формате — удобно искать по ключам через `docker logs | jq`.
"""

import logging
import sys
from typing import Any

import structlog


def настроить_логирование(уровень: str = "INFO") -> Any:
    """Настраивает structlog + stdlib logging для JSON-вывода.

    Args:
        уровень: уровень логирования (DEBUG / INFO / WARNING / ERROR / CRITICAL)

    Returns:
        Готовый к использованию логгер.
    """
    числовой_уровень = getattr(logging, уровень.upper(), logging.INFO)

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=числовой_уровень,
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(ensure_ascii=False),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(числовой_уровень),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()

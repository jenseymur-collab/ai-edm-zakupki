"""Тесты health-check эндпоинтов."""

from fastapi.testclient import TestClient


def test_health_возвращает_200_и_статус_ok(клиент: TestClient) -> None:
    """GET /health → 200 со статусом ok."""
    ответ = клиент.get("/health")

    assert ответ.status_code == 200
    тело = ответ.json()
    assert тело["статус"] == "ok"


def test_health_содержит_все_обязательные_поля(клиент: TestClient) -> None:
    """Ответ /health содержит статус, версию, окружение, время."""
    ответ = клиент.get("/health")
    тело = ответ.json()

    обязательные_поля = {"статус", "версия", "окружение", "время"}
    assert обязательные_поля.issubset(тело.keys())


def test_health_версия_корректная(клиент: TestClient) -> None:
    """Версия в /health совпадает с версией пакета."""
    from app import __version__

    ответ = клиент.get("/health")
    тело = ответ.json()

    assert тело["версия"] == __version__


def test_swagger_docs_доступны(клиент: TestClient) -> None:
    """GET /docs возвращает HTML с автодокументацией FastAPI."""
    ответ = клиент.get("/docs")

    assert ответ.status_code == 200
    assert "swagger" in ответ.text.lower()

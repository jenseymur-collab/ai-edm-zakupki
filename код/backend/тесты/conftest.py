"""Общие pytest-фикстуры."""

import pytest
from fastapi.testclient import TestClient

from app.главный import приложение


@pytest.fixture
def клиент() -> TestClient:
    """Синхронный HTTP-клиент для тестов FastAPI."""
    return TestClient(приложение)

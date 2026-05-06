FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Сначала копируем манифест и минимальные файлы — лучшее кеширование слоёв
COPY pyproject.toml README.md ./
COPY app ./app

# Установка зависимостей
RUN pip install --upgrade pip && \
    pip install ".[dev]"

# Тесты копируем отдельным слоем
COPY тесты ./тесты

EXPOSE 8000

# Команда переопределяется в docker-compose для dev-режима с --reload
CMD ["uvicorn", "app.главный:приложение", "--host", "0.0.0.0", "--port", "8000"]

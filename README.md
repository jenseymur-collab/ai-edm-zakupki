# AI-EDM Закупки — Электронный документооборот с AI-слоем

MVP системы управления закупочными сделками: согласование документов, маршруты виз,
семантический поиск и LLM-анализ на базе Claude (via OpenRouter).

---

## Быстрый старт (5 команд)

```bash
# 1. Перейти в папку проекта
cd /Users/user/Documents/ai-edm-закупки

# 2. Создать .env с ключом OpenRouter
echo "OPENROUTER_API_KEY=sk-or-..." > .env

# 3. Собрать и поднять все сервисы
docker compose up -d --build

# 4. Залить демо-данные (один раз)
docker compose exec backend python seed.py

# 5. Открыть фронтенд
open http://localhost:3000
```

Swagger UI бекенда: http://localhost:8000/docs

---

## Что показывает демо

| Экран | Путь | Что работает |
|---|---|---|
| **Список сделок** | `/deals` | Таблица с пагинацией, статусы, суммы, поставщики |
| **Карточка сделки** | `/deals/{id}` | 3 вкладки: Документы / Согласование / AI |
| **Документы** | вкладка Документы | Активная + архивные версии, загрузка новой |
| **Согласование** | вкладка Согласование | Цепочка виз: ожидает / одобрено / отклонено |
| **AI-анализ** | вкладка AI | Полнота пакета, риски задержек, сравнение версий |
| **Документ** | `/documents/{id}` | Текст + LLM-извлечение полей |
| **Семантический поиск** | `/search` | Поиск по тексту документов (pgvector cosine) |
| **Дашборд** | `/dashboard` | KPI, статусы сделок, лента событий |

---

## Архитектура

```
┌─────────────────────────────────────────────────────┐
│  Browser → Next.js 14 (port 3000)                   │
│            ↓  fetch http://localhost:8000            │
│  FastAPI + SQLAlchemy 2.0 (port 8000)               │
│            ↓                                         │
│  PostgreSQL 16 + pgvector (port 5432)               │
│                                                      │
│  AI: OpenRouter → anthropic/claude-sonnet-4-5        │
│      Embeddings: openai/text-embedding-3-small       │
└─────────────────────────────────────────────────────┘
```

### Стек

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 async, Pydantic v2
- **DB**: PostgreSQL 16 с расширением pgvector (Vector(1536))
- **AI**: OpenRouter API (LLM + embeddings), идентификаторы — кириллица (ADR)
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS 3
- **Инфра**: Docker Compose, hot-reload в dev-режиме

### Физические схемы БД

| Схема | Содержимое |
|---|---|
| `пользователи` | Пользователи, роли |
| `сделки` | Сделки, поставщики |
| `документы` | Документы, извлечённые поля, эмбеддинги |
| `согласование` | Маршруты, шаги, визы |
| `аудит` | Лента событий |

---

## AI-эндпоинты

```
POST /ai/documents/{id}/extract      — LLM извлекает поля по типу документа
POST /ai/search                      — семантический поиск по документам
GET  /ai/deals/{id}/completeness     — проверка полноты пакета (7 типов)
GET  /ai/deals/{id}/delays           — анализ просрочек и рисков виз
POST /ai/documents/compare           — сравнение двух версий документа
```

---

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `OPENROUTER_API_KEY` | — | **Обязательно.** Ключ OpenRouter |
| `DATABASE_URL` | postgresql+asyncpg://edm:edm@postgres:5432/edm | URL базы данных |
| `LLM_MODEL_EXTRACTION` | anthropic/claude-sonnet-4-5 | Модель для извлечения полей |
| `LLM_MODEL_SEARCH` | anthropic/claude-sonnet-4-5 | Модель для поиска |
| `LLM_MODEL_DELAYS` | anthropic/claude-sonnet-4-5 | Модель для анализа задержек |
| `LLM_MODEL_AUDIT` | anthropic/claude-sonnet-4-5 | Модель для аудита |
| `LLM_MODEL_COMPARISON` | anthropic/claude-opus-4-6 | Модель для сравнения версий |
| `LLM_MODEL_EMBEDDINGS` | openai/text-embedding-3-small | Модель эмбеддингов |
| `NEXT_PUBLIC_API_URL` | http://localhost:8000 | URL бекенда для браузера |

---

## Структура проекта

```
ai-edm-закупки/
├── docker-compose.yml
├── .env                          # OPENROUTER_API_KEY (не коммитить)
├── код/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── главный.py        # FastAPI + CORS + роуты
│   │   │   ├── конфиг.py         # Pydantic Settings
│   │   │   ├── база.py           # async engine + sessionmaker
│   │   │   ├── llm_client.py     # OpenRouter (единая точка выхода)
│   │   │   ├── модели/           # SQLAlchemy ORM
│   │   │   ├── модули/
│   │   │   │   ├── сделки/       # роутер + схемы + сервисы
│   │   │   │   ├── документы/    # роутер + схемы + сервисы AI
│   │   │   │   └── согласование/ # роутер + схемы
│   │   │   └── api/
│   │   │       ├── __init__.py   # регистрация роутеров
│   │   │       └── ai_роутер.py  # /ai/* эндпоинты
│   │   └── seed.py               # демо-данные
│   └── frontend/
│       ├── app/                  # Next.js App Router страницы
│       ├── lib/
│       │   ├── api.ts            # типизированный API-клиент
│       │   └── helpers.ts        # форматирование, константы
│       └── next.config.mjs
└── промты/                       # логи сессий разработки
```

---

## Разработка

```bash
# Логи всех сервисов
docker compose logs -f

# Логи только бекенда / фронтенда
docker compose logs -f backend
docker compose logs -f frontend

# Перезапуск после изменений (volumes монтированы — обычно достаточно)
docker compose restart backend
docker compose restart frontend

# Полная пересборка (при изменении package.json / requirements.txt)
docker compose up -d --build
```

# AI-EDM Закупки

**Электронный документооборот закупок с AI-слоем**  
MVP системы управления закупочными сделками для ООО «ФармПроизводство».

GitHub: https://github.com/jenseymur-collab/ai-edm-zakupki

---

## Что умеет система

| Функциональность | Реализация |
|---|---|
| Список и карточки сделок | CRUD, статусы, KPI, суммы, поставщики |
| Загрузка документов | Форма в UI, версионирование (активная + архив) |
| Цепочки согласования (визы) | Маршруты по типу и сумме, одобрение/отклонение прямо из UI |
| AI-извлечение реквизитов | LLM разбирает текст документа: стороны, суммы, ИНН, сроки |
| Проверка полноты пакета | AI проверяет наличие всех обязательных документов по сделке |
| Анализ просрочек | AI выявляет задержанные визы и предлагает действия |
| Сравнение версий договора | LLM сравнивает две версии, выделяет изменения по пунктам |
| Семантический поиск | pgvector cosine search, понимает смысл, не только ключевые слова |
| Дашборд с алертами | KPI, статусы сделок, красный алерт при просроченных визах |

---

## Быстрый старт

### Требования
- Docker Desktop (версия 24+)
- Ключ OpenRouter API — получить на [openrouter.ai](https://openrouter.ai)

### 5 команд для запуска

```bash
# 1. Клонировать репозиторий
git clone https://github.com/jenseymur-collab/ai-edm-zakupki.git
cd ai-edm-zakupki

# 2. Создать файл с переменными окружения
cp .env.example .env
# Открыть .env и вставить свой OPENROUTER_API_KEY

# 3. Собрать и поднять все сервисы
docker compose up -d --build

# 4. Загрузить демо-данные (один раз)
docker compose exec backend python seed.py

# 5. Открыть приложение
open http://localhost:3000
```

**Swagger UI (API-документация):** http://localhost:8000/docs

### После запуска — активировать семантический поиск

Перейти в Swagger → `POST /ai/embeddings/backfill` → Execute.  
Займёт ~20–30 секунд. После этого поиск на `/search` полностью работает.

---

## Навигация по интерфейсу

| Экран | URL | Описание |
|---|---|---|
| Главная | `/` | Лендинг: разделы, AI-возможности, стек |
| Сделки | `/deals` | Таблица с фильтрами и статусами |
| Карточка сделки | `/deals/{id}` | Документы / Согласование / AI |
| Документ | `/documents/{id}` | Текст + LLM-извлечение полей |
| Семантический поиск | `/search` | Поиск по смыслу через pgvector |
| Дашборд | `/dashboard` | KPI, алерты, лента событий |

---

## Архитектура

```
Браузер
  │
  ▼
Next.js 14 (порт 3000)          ← App Router, TypeScript, Tailwind CSS
  │  fetch NEXT_PUBLIC_API_URL
  ▼
FastAPI (порт 8000)              ← Python 3.12, SQLAlchemy 2.0 async, Pydantic v2
  │  asyncpg
  ▼
PostgreSQL 16 + pgvector         ← Vector(1536), cosine similarity search
  
  + OpenRouter API               ← LLM: claude-sonnet / claude-opus
                                 ← Embeddings: text-embedding-3-small
```

### Структура базы данных

Пять PostgreSQL-схем:

| Схема | Таблицы | Назначение |
|---|---|---|
| `пользователи` | пользователи, роли | Учётные записи и права |
| `сделки` | сделки, поставщики | Закупочные сделки |
| `документы` | документы, извлечённые_поля, эмбеддинги | Документооборот и AI |
| `согласование` | маршруты, шаги, визы | Цепочки согласования |
| `аудит` | события | Лента всех действий |

### AI-эндпоинты

```
POST /ai/documents/{id}/extract       — LLM извлекает реквизиты из документа
POST /ai/search                       — семантический поиск (pgvector)
GET  /ai/deals/{id}/completeness      — проверка полноты пакета документов
GET  /ai/deals/{id}/delays            — анализ просрочек и рисков по визам
POST /ai/documents/compare            — LLM сравнивает две версии договора
POST /ai/embeddings/backfill          — создать эмбеддинги для всех документов
```

---

## Принятые архитектурные решения

### ADR-1: Кириллические идентификаторы в Python
Python 3 поддерживает Unicode в именах переменных и функций.  
Весь код бекенда написан на кириллице (функции, переменные, классы) — это намеренное решение для читаемости в предметной области.  
**Исключение:** URL path-параметры — только ASCII (ограничение Starlette/ASGI).

### ADR-2: pgvector для семантического поиска
Вместо отдельного векторного хранилища (Pinecone, Weaviate) используется расширение pgvector для PostgreSQL.  
Одна БД — меньше инфраструктуры, проще деплой. Для MVP-масштаба достаточно.

### ADR-3: BackgroundTasks для эмбеддингов
После загрузки документа эмбеддинг создаётся в фоне (FastAPI BackgroundTasks) — не блокирует HTTP-ответ.  
Используется отдельная сессия БД через `фабрика_сессий()`.

### ADR-4: OpenRouter как единая точка LLM
Все LLM-вызовы идут через OpenRouter API (совместим с OpenAI SDK).  
Позволяет менять модели через переменные окружения без изменения кода.

### ADR-5: Next.js App Router без SSR для API-запросов
Все запросы к бекенду делаются на клиенте (`'use client'` + `useEffect`).  
Упрощает деплой: фронтенд — чисто статический SPA поверх API.

---

## Переменные окружения

Скопировать `.env.example` → `.env` и заполнить:

| Переменная | Обязательна | Описание |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ | API-ключ OpenRouter |
| `DATABASE_URL` | нет | По умолчанию: `postgresql+asyncpg://edm:edm@postgres:5432/edm` |
| `OPENROUTER_BASE_URL` | нет | По умолчанию: `https://openrouter.ai/api/v1` |
| `LLM_MODEL_EXTRACTION` | нет | По умолчанию: `anthropic/claude-sonnet-4-5` |
| `LLM_MODEL_SEARCH` | нет | По умолчанию: `anthropic/claude-sonnet-4-5` |
| `LLM_MODEL_DELAYS` | нет | По умолчанию: `anthropic/claude-sonnet-4-5` |
| `LLM_MODEL_AUDIT` | нет | По умолчанию: `anthropic/claude-sonnet-4-5` |
| `LLM_MODEL_COMPARISON` | нет | По умолчанию: `anthropic/claude-opus-4-6` |
| `LLM_MODEL_EMBEDDINGS` | нет | По умолчанию: `openai/text-embedding-3-small` |
| `NEXT_PUBLIC_API_URL` | нет | URL бекенда для браузера. По умолчанию: `http://localhost:8000` |

---

## Структура проекта

```
ai-edm-закупки/
├── docker-compose.yml              # локальный запуск всех сервисов
├── .env                            # секреты — не коммитить (в .gitignore)
├── .env.example                    # шаблон для новых разработчиков
├── .gitignore
├── Makefile
├── README.md
├── код/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── railway.toml            # конфиг деплоя Railway
│   │   ├── pyproject.toml
│   │   ├── seed.py                 # демо-данные
│   │   └── app/
│   │       ├── главный.py          # FastAPI app, CORS, регистрация роутеров
│   │       ├── конфиг.py           # Pydantic Settings
│   │       ├── общее/
│   │       │   └── база_данных.py  # async engine, sessionmaker, фабрика_сессий
│   │       ├── llm_client.py       # единая точка выхода в OpenRouter
│   │       ├── модели/             # SQLAlchemy ORM-модели
│   │       ├── модули/
│   │       │   ├── сделки/         # роутер, схемы, сервисы
│   │       │   ├── документы/      # роутер, схемы, AI-сервисы, эмбеддинги
│   │       │   └── согласование/   # роутер, схемы, маршруты виз
│   │       └── api/
│   │           ├── __init__.py     # регистрация всех роутеров
│   │           └── ai_роутер.py    # /ai/* эндпоинты
│   └── frontend/
│       ├── Dockerfile              # multi-stage production build
│       ├── railway.toml            # конфиг деплоя Railway
│       ├── next.config.ts          # output: standalone
│       ├── app/                    # Next.js App Router страницы
│       │   ├── page.tsx            # лендинг-страница
│       │   ├── layout.tsx          # навигация, общий layout
│       │   ├── deals/              # список и карточки сделок
│       │   ├── documents/          # карточка документа
│       │   ├── search/             # семантический поиск
│       │   └── dashboard/          # дашборд с KPI
│       └── lib/
│           ├── api.ts              # типизированный API-клиент
│           └── helpers.ts          # форматирование дат, сумм
├── документация/                   # ADR и технические заметки
├── демо-данные/                    # SQL seed-скрипты
├── промты/                         # логи всех сессий разработки
└── тесты/                          # pytest (в разработке)
```

---

## Разработка

```bash
# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f backend
docker compose logs -f frontend

# Перезапуск после изменений в коде
docker compose restart backend

# Полная пересборка (при изменении зависимостей)
docker compose up -d --build

# Запустить только postgres (для локальной разработки без Docker)
docker compose up -d postgres
```

---

## Технологический стек

| Слой | Технологии |
|---|---|
| Backend | Python 3.12, FastAPI 0.115, SQLAlchemy 2.0 async, Pydantic v2, Alembic |
| Database | PostgreSQL 16, pgvector (cosine similarity, Vector(1536)) |
| AI/LLM | OpenRouter API, Claude Sonnet/Opus, text-embedding-3-small |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS 3 |
| Инфраструктура | Docker Compose, Uvicorn, asyncpg |
| Деплой | Railway (backend + frontend + postgres) |

---

## Продакшн деплой (Railway)

Система задеплоена на Railway и доступна публично:

| Сервис | URL |
|---|---|
| **Фронтенд** | https://earnest-playfulness-production-7b37.up.railway.app |
| **Бекенд API** | https://ai-edm-zakupki-production.up.railway.app |
| **Swagger UI** | https://ai-edm-zakupki-production.up.railway.app/docs |

### Архитектура на Railway

Три сервиса в одном Railway-проекте:
- `pgvector` — PostgreSQL 16 + pgvector (кастомный Docker-образ `pgvector/pgvector:pg16`)
- `backend` — FastAPI, root directory: `код/backend`
- `frontend` — Next.js 14, root directory: `код/frontend`

### После первого деплоя (один раз)

```bash
# 1. Залить демо-данные
curl -X POST https://ai-edm-zakupki-production.up.railway.app/ai/admin/seed

# 2. Создать эмбеддинги для поиска
curl -X POST https://ai-edm-zakupki-production.up.railway.app/ai/embeddings/backfill
```

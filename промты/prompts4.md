# Prompts 4 — AI-EDM Закупки

**Дата:** 2026-05-07  
**Сессия:** 5 (продолжение) — GitHub + Railway (Block B)  
**Статус на старте:** Blocks D и C завершены, лендинг готов, промты выгружены

---

## Контекст

Продолжение сессии 5 после исчерпания контекста. Система полностью работает локально.  
GitHub-репозиторий: https://github.com/jenseymur-collab/ai-edm-zakupki

---

## Промты сессии

### Промт 1
> GitHub username jenseymur-collab

### Промт 2
> remote: Repository not found.  
> fatal: repository 'https://github.com/jenseymur-collab/ai-edm-zakupki.git/' not found

### Промт 3
> у меня в задании есть такой пункт: Необходимо выложить репозиторий в публичный доступ — влияет на оценку качества проверки задания

### Промт 4
> создала

### Промт 5
> вот такой есть файл: .env.example, это норм?

### Промт 6
> remote: error: GH013: Repository rule violations found for refs/heads/main.  
> remote: - GITHUB PUSH PROTECTION — Push cannot contain secrets  
> (файл .env.save содержал реальный OPENROUTER_API_KEY)

### Промт 7
> вроде ошибку не выдал

### Промт 8
> давай перейдем к Railway (Block B)

### Промт 9
> привет! оформи и загрузи в папку проекта 2 документа. Первый документ: файл с промтами и назови его "prompts4", тип файла .md. Второй документ: стандартный файл с описанием системы, архитектурой, принятые решения и с инструкций по запуску, назови этот файл README, тип файла .md.

---

## Лог работы

### GitHub (ЗАВЕРШЁН)

**Проблемы и решения:**
- `.env.save` попал в коммит → добавлен в `.gitignore`, удалён через `git rm --cached`, коммит перезаписан (`git commit --amend`), запушен принудительно (`git push -f`)
- GitHub Push Protection заблокировал push из-за реального API-ключа в `.env.save` — устранено до публикации

**Итог:**
- Репозиторий: https://github.com/jenseymur-collab/ai-edm-zakupki (Public)
- Файлы в репозитории: `.env.example` (заглушка), `.gitignore`, весь код

**Новые файлы в проекте:**
- `.gitignore` — исключает `.env`, `.env.save`, `__pycache__/`, `node_modules/`, `.next/`, `venv/` и др.
- `.env.example` — шаблон с placeholder-значениями для нового разработчика

---

### Block B — Railway (В ПРОЦЕССЕ)

**Подготовлены файлы для деплоя:**
- `код/frontend/Dockerfile` — переписан на multi-stage production build (builder → runner, `node server.js`)
- `код/frontend/next.config.ts` — добавлен `output: 'standalone'` для Next.js standalone сборки
- `код/backend/railway.toml` — конфиг Railway: Dockerfile builder, healthcheck `/health`, restart on failure
- `код/frontend/railway.toml` — конфиг Railway: Dockerfile builder, healthcheck `/`, restart on failure

**Архитектура деплоя на Railway:**
- Сервис `postgres` — кастомный Docker образ `pgvector/pgvector:pg16` (Railway native Postgres не имеет pgvector)
- Сервис `backend` — FastAPI из `код/backend/`, переменные через Railway Variables
- Сервис `frontend` — Next.js из `код/frontend/`, `NEXT_PUBLIC_API_URL` = URL бекенда

**Статус:** настройка Railway Dashboard — следующий шаг

---

### Block B — Railway (ЗАВЕРШЁН ✅)

**Проблемы и решения в процессе деплоя:**
- `$PORT` не раскрывался в railway.toml → обёрнуто в `bash -c '... --port ${PORT:-8000}'`
- Railway назначил порт 8080 вместо 8000/3000 → домены перегенерированы на порт 8080
- Next.js уязвимость CVE-2025-55184 → обновлён до 14.2.35
- `npm ci` падал без lockfile → заменён на `npm install`
- `.next/standalone` не найден → добавлен `next.config.mjs` с `output: 'standalone'`
- `seed.py` не копировался в Docker-образ → добавлен `COPY seed.py ./` в Dockerfile
- `NEXT_PUBLIC_API_URL` не был установлен во фронтенд-сервисе → добавлен в Variables
- CORS не пускал Railway-домен → добавлен в `allow_origins` в главный.py

**Финальные URL:**
- Фронтенд: https://earnest-playfulness-production-7b37.up.railway.app
- Бекенд: https://ai-edm-zakupki-production.up.railway.app
- GitHub: https://github.com/jenseymur-collab/ai-edm-zakupki

**Статус:** Railway деплой полностью завершён, демо-данные залиты, эмбеддинги созданы ✅

---

## Результат работы — AI-EDM Закупки

**Разработан и задеплоен MVP системы электронного документооборота закупок с AI-слоем** для ООО «ФармПроизводство».

### Что реализовано

Система управляет полным жизненным циклом закупочной сделки: от создания до закрытия. Включает загрузку и версионирование документов, маршруты согласования с цепочками виз, дашборд с мониторингом просрочек и AI-функции поверх всего этого.

**AI-возможности:**
- Автоматическое извлечение реквизитов из документов (стороны, суммы, ИНН, сроки) — через LLM без ручного ввода
- Семантический поиск по всем документам — понимает смысл запроса, а не только ключевые слова (pgvector + OpenAI embeddings)
- Проверка полноты пакета документов по сделке — AI сигнализирует о недостающих позициях
- Анализ просроченных виз — AI выявляет риски и предлагает конкретные действия
- Сравнение версий договора — LLM выделяет изменения по пунктам и оценивает юридические риски

### Технические решения

Стек: **FastAPI + PostgreSQL 16 + pgvector + Next.js 14 + Docker Compose**. LLM — через OpenRouter (Claude Sonnet для основных задач, Claude Opus для сравнения версий договоров).

Ключевые архитектурные решения: модульный монолит вместо микросервисов, pgvector как векторное хранилище внутри основной БД, кириллические идентификаторы в Python-коде для читаемости в предметной области.

### Доступность

Система задеплоена в продакшн на Railway и доступна публично:
- **Приложение:** https://earnest-playfulness-production-7b37.up.railway.app
- **Репозиторий:** https://github.com/jenseymur-collab/ai-edm-zakupki

Локальный запуск — одной командой через Docker Compose: `docker compose up -d --build`.

### Дополнительные комментарии

Система спроектирована с запасом на развитие: авторизация, мобильный UI и расширение AI-функций готовы как следующие шаги. Все сессии разработки задокументированы в папке `промты/` репозитория.

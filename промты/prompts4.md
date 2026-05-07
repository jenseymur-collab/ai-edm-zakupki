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

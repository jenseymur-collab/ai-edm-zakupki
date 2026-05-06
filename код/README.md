# Код

Исходники приложения. Структура внутри будет зависеть от выбора стека (см. Фаза 0).

## Предполагаемая структура (после выбора стека)

```
код/
├── backend/        # API-сервис (FastAPI / Express / etc.)
│   ├── src/
│   ├── pyproject.toml (или package.json)
│   └── README.md
├── frontend/       # UI (Next.js / React / etc.)
│   ├── src/
│   ├── package.json
│   └── README.md
└── shared/         # общие схемы/типы (если применимо)
```

## Принципы (из safety-протокола)

- Никаких placeholder-ов (`...`, `TODO`, "should exist", "assume").
- Все DTO/схемы — явные (Pydantic / Zod / TypeScript types).
- Каждая внешняя интеграция — с timeout, retry, fallback.
- Каждый эндпоинт — с input-валидацией, error-handling, минимальным логированием.
- Idempotency на действиях согласования.

## Code review checklist

Перед мерджем любого блока проверяем:

- [ ] Импорты существуют, методы существуют (не выдуманы)
- [ ] Happy path работает
- [ ] Empty input не ломает
- [ ] Ошибки обработаны явно
- [ ] Нет архитектурных нарушений (см. `safety/`)

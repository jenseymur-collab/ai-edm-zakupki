.PHONY: help up down logs build test fmt lint clean

help:
	@echo ""
	@echo "AI-EDM Закупки MVP — команды"
	@echo "==============================="
	@echo "  make up      — запустить весь стек (backend + postgres)"
	@echo "  make down    — остановить и удалить контейнеры"
	@echo "  make logs    — смотреть логи backend (Ctrl+C для выхода)"
	@echo "  make build   — пересобрать docker-образы"
	@echo "  make test    — прогнать backend-тесты в контейнере"
	@echo "  make fmt     — форматировать backend-код (ruff format)"
	@echo "  make lint    — проверить backend-код линтером (ruff)"
	@echo "  make clean   — УДАЛИТЬ контейнеры + БД (опасно!)"
	@echo ""

up:
	docker-compose up -d
	@echo ""
	@echo "✅ Стек поднят. Проверь:"
	@echo "   http://localhost:8000/health  → backend жив"
	@echo "   http://localhost:8000/docs    → автодока FastAPI"
	@echo ""

down:
	docker-compose down

logs:
	docker-compose logs -f backend

build:
	docker-compose build

test:
	docker-compose run --rm backend pytest -v

fmt:
	docker-compose run --rm backend ruff format app тесты

lint:
	docker-compose run --rm backend ruff check app тесты

clean:
	docker-compose down -v
	@echo "⚠️  Все volumes удалены, БД очищена."

# cloud-deploy-practice

Минимальный fullstack (React + Express + PostgreSQL) для практики деплоя: статика на S3/CDN, backend в контейнере, БД — managed PostgreSQL.

## Структура

- `client/` — React (Vite), сборка в `dist/`
- `server/` — Express REST API, Dockerfile

## Переменные окружения

### Server (`server/.env`)

| Переменная | Описание |
|------------|----------|
| `PORT` | Порт HTTP (по умолчанию `3000`) |
| `DATABASE_URL` | Строка подключения PostgreSQL, например `postgresql://user:pass@host:5432/dbname` |
| `CORS_ORIGIN` | Разрешённый origin фронта, например `http://localhost:5173` или URL CDN |

### Client (локально `client/.env`, в проде — при сборке)

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | Базовый URL API, например `http://localhost:3000` |

## Локальный запуск

### 1. PostgreSQL

Нужен запущенный PostgreSQL и пустая БД. Создай пользователя/БД или используй Docker:

```bash
docker run --name pg-practice -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=practice -p 5432:5432 -d postgres:16-alpine
```

Строка подключения:

`postgresql://postgres:postgres@localhost:5432/practice`

### 2. Backend

```bash
cd server
cp .env.example .env
# отредактируй .env — DATABASE_URL и при необходимости CORS_ORIGIN
npm install
npm start
```

API: `http://localhost:3000`  
`GET /items`, `POST /items` с телом `{ "title": "текст" }`.

### 3. Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Открой `http://localhost:5173`.

### Сборка фронта для S3/CDN

```bash
cd client
# перед сборкой задай URL продакшен API
set VITE_API_URL=https://api.example.com
npm run build
```

Загрузи содержимое `client/dist/` в бакет и включи статический хостинг + CDN.

### Docker (только backend)

Из корня репозитория:

```bash
docker build -t practice-api ./server
docker run --rm -p 3000:3000 -e DATABASE_URL="postgresql://..." -e CORS_ORIGIN="https://your-cdn.example.com" practice-api
```

`PORT` внутри контейнера по умолчанию `3000`; при деплое пробрось переменные из секретов провайдера.

## Деплой (кратко)

1. **БД** — managed PostgreSQL, скопируй `DATABASE_URL` в секреты сервиса API.
2. **Backend** — образ из `server/Dockerfile`, переменные `DATABASE_URL`, `CORS_ORIGIN` (URL фронта), при необходимости `PORT`.
3. **Frontend** — `npm run build` с `VITE_API_URL` на публичный URL API; выгрузка `dist/` в S3, CloudFront или аналог.

Таблица `items` создаётся автоматически при старте сервера (`CREATE TABLE IF NOT EXISTS`).

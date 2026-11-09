# Banna AI Backend

Express REST API for Banna AI with PostgreSQL persistence, JWT authentication, and OpenAI-compatible chat completions. Requires Node.js 18+.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, a private random `JWT_SECRET` (at least 32 characters), and `OPENAI_API_KEY`.
3. Create a PostgreSQL database matching your connection URL. The database user needs permission to create the `pgcrypto` extension (or have an administrator enable it once).
4. Run `npm run db:migrate` to create the tables, then run `npm run dev`.

The server also applies the idempotent schema on startup. The explicit migration command is useful for deployment checks. Do not commit `.env` or expose provider keys in client apps.

## API

All protected endpoints require `Authorization: Bearer <token>`.

### Authentication

- `POST /api/auth/register` — JSON `{ "name": "A User", "email": "person@example.com", "password": "at-least-8-chars" }`
- `POST /api/auth/login` — JSON `{ "email": "person@example.com", "password": "..." }`
- `GET /api/users/me` — current account (protected)

Register/login return `{ "user": { "id", "name", "email", "created_at" }, "token": "..." }`. Passwords are bcrypt-hashed and never returned.

### Chats

- `POST /api/chats` — create a conversation and generate a reply: `{ "message": "Hello" }`
- `POST /api/chats` — continue a conversation: `{ "conversationId": "uuid", "message": "Follow-up" }`
- `GET /api/chats` — list the signed-in user's conversations
- `GET /api/chats/:conversationId/messages` — retrieve its messages

Conversation access is scoped to the authenticated user. Chat requests are rate limited, prompts are limited to 12,000 characters, and recent history is sent to the configured model. If the AI provider fails, the user's submitted message is retained and the API returns an error; clients can retry by sending a new message.

### Health

- `GET /api/health` — service and database readiness

## Configuration

`OPENAI_API_KEY` is only read by the server. `OPENAI_API_URL` may be set to an OpenAI-compatible chat-completions endpoint. `OPENAI_MODEL` defaults to `gpt-4o-mini`. Configure `CORS_ORIGINS` as a comma-separated allowlist for deployed clients. PostgreSQL TLS can be enabled with `DATABASE_SSL=true`.

## Security notes

Use HTTPS in production; keep database credentials, JWT secret, and model API key in your deployment's secret manager. Configure CORS to your exact app origins. JWTs currently expire after seven days by default; clients should store tokens securely and require login again when expired.

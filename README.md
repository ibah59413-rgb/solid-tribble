# Solid Tribble Backend

This repository now includes a default backend starter for the app.

## Stack
- Node.js
- Express
- PostgreSQL support with optional in-memory fallback
- Environment-based configuration

## Prerequisites
- Node.js 18+
- npm

## Installation

```bash
npm install
```

## Environment setup

Copy the example env file and update the values:

```bash
cp .env.example .env
```

## Start the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Available endpoints

### Health
```http
GET /api/health
```

### Users
```http
GET /api/users
GET /api/users/:id
POST /api/users
```

Example POST body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

## Database configuration

If `DATABASE_URL` is set in your `.env`, the app will try to connect to PostgreSQL.
If it is not set, the app continues to run with an in-memory user store so you can start developing immediately.

## Example `.env`

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
```

## Notes

This starter is intentionally simple and can be extended with authentication, database models, validation, and production-ready APIs as your app grows.

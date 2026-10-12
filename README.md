# Yuki API

A Cloudflare Workers-based API for managing posts with a typed HTTP API and real-time WebSocket topic streaming.

## Overview

Yuki API is a lightweight backend built with TypeScript and the Effect ecosystem. It exposes a REST API for post CRUD operations and a WebSocket Durable Object for topic-based live notifications.

The project is designed to run on Cloudflare's edge infrastructure and uses:

- Cloudflare Workers
- Cloudflare D1 for persistence
- Durable Objects for WebSocket subscription management
- Drizzle ORM for database access
- Effect for HTTP routing, validation, and typed API contracts

## Features

- List all posts
- Fetch a single post by ID
- Create a new post
- OpenAPI documentation via `/docs`
- OpenAPI schema at `/openapi.json`
- Real-time topic subscriptions over WebSocket at `/ws`

## Tech Stack

- TypeScript
- Effect
- Drizzle ORM
- Cloudflare D1
- Durable Objects
- Vite + Cloudflare tooling
- Bun package manager

## Project Structure

```text
.
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   ├── contract.ts
│   ├── index.ts
│   ├── server.ts
│   └── stream-durable-object.ts
├── migrations/
├── .gitignore
├── bun.lock
├── cloudflare.config.ts
├── drizzle.config.ts
├── oxfmt.config.ts
├── oxlint.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE
└── README.md
```

## API

The API is defined in `src/contract.ts` and mounted under `/api/posts`.

### Endpoints

- `GET /api/posts` — list all posts
- `GET /api/posts/:id` — fetch one post by ID
- `POST /api/posts` — create a new post

Example response for `GET /api/posts`:

```json
{
  "posts": [
    {
      "id": 1,
      "title": "Hello world",
      "content": "This is a sample post",
      "createdAt": "2026-10-12T00:00:00.000Z",
      "updatedAt": "2026-10-12T00:00:00.000Z"
    }
  ]
}
```

## WebSocket Streaming

The service exposes a Durable Object-backed WebSocket endpoint at `/ws`.

Client messages can include:

```json
{
  "action": "subscribe",
  "topic": "updates"
}
```

Supported actions:

- `subscribe`
- `unsubscribe`
- `publish`

Messages are broadcast to all connected clients subscribed to a given topic.

## Database

The app uses D1 with Drizzle ORM. The schema is defined in:

- `src/infrastructure/persistence/drizzle/schema.ts`

The migration folder contains generated SQL for the current schema.

## Local Development

### Prerequisites

- Node.js
- Bun
- Cloudflare account / Wrangler-compatible tooling

### Install dependencies

```bash
bun install
```

### Start the development server

```bash
bun run dev
```

This launches the Cloudflare worker and serves the local API environment.

### Build

```bash
bun run build
```

### Lint / type-check

```bash
bun run check
```

## Production Deployment

The project includes Cloudflare deployment scripts:

```bash
bun run deploy
```

and teardown:

```bash
bun run destroy
```

## Configuration Notes

The worker is configured in `cloudflare.config.ts` and defines:

- a D1 binding named `DB`
- a Durable Object binding named `Stream`

The app is structured as a Cloudflare Worker entrypoint with the main HTTP handler defined in `src/index.ts`.

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2026 tiesen243

## Contributing

Contributions are welcome. Please keep the code typed, follow the project linting rules, and validate the app using the provided scripts before submitting changes.

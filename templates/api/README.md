# NestJS v12 Production Starter

A modern, high-performance **NestJS v12** template powered by **Fastify**, **Drizzle ORM**, **Better Auth**, **Rspack**, **Oxfmt/Oxlint**, and **Pino** logging.

---

## ⚡ Key Architectural Features

- **🚀 Engine & Bundler**: [NestJS v12](https://nestjs.com) with `@nestjs/platform-fastify`, compiled with [@rspack/core](https://rspack.dev) (~40ms builds) and native ESM.
- **🗄️ Database & ORM**: [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`postgres.js` client with connection pooling, migrations, and modular schema).
- **🔐 Authentication**: [Better Auth](https://better-auth.com) + `@thallesp/nestjs-better-auth` with Drizzle adapter, `admin()` and `bearer()` plugins, and typed `AuthService`.
- **🪵 High-Performance Logging**: [Pino](https://getpino.io) + `nestjs-pino` with pretty-printed development logs and JSON streaming in production.
- **🛡️ Security**: `@fastify/helmet` (HTTP headers), `@nestjs/throttler` (Rate limiting), and `@fastify/compress` (Gzip/Deflate).
- **📦 Validation**: Native NestJS v12 `StandardSchemaValidationPipe` with **Zod** DTOs (zero reflection overhead).
- **🎯 Standard Response**: Modular `TransformInterceptor` formatting responses into `{ statusCode, success, data, meta: { timestamp } }`.
- **📖 API Documentation**: OpenAPI Swagger spec rendered via modern [Scalar UI](https://scalar.com) at `/docs` (gated in production).
- **🩺 Health Probes**: Active PostgreSQL connectivity check at `/health`.

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- [Docker](https://www.docker.com) (for local PostgreSQL)

### 2. Installation & Setup

```bash
# Clone the repository
git clone <repo-url>
cd nest-v12

# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start local PostgreSQL database
docker compose up -d

# Generate migrations and seed the database
bun run db:generate
bun run db:push
bun run db:seed
```

### 3. Start Development Server

```bash
bun run dev
```

The API will start at `http://localhost:3000/api`.
Interactive API documentation is available at `http://localhost:3000/docs`.

---

## 📜 Available Scripts

| Command                | Description                                    |
| :--------------------- | :--------------------------------------------- |
| `bun run dev`          | Starts development server with watch mode      |
| `bun run build`        | Compiles application using Rspack              |
| `bun run start:prod`   | Runs production build from `dist/main`         |
| `bun run test`         | Runs unit tests using Vitest                   |
| `bun run test:e2e`     | Runs end-to-end tests using Vitest             |
| `bun run format`       | Formats codebase using Oxfmt (no semicolons)   |
| `bun run format:check` | Verifies code formatting                       |
| `bun run lint`         | Lints codebase using Oxlint                    |
| `bun run db:generate`  | Generates Drizzle migration files from schemas |
| `bun run db:migrate`   | Runs pending Drizzle migrations                |
| `bun run db:push`      | Pushes schema changes directly to DB           |
| `bun run db:studio`    | Opens Drizzle Studio database UI               |
| `bun run db:seed`      | Seeds database with demo admin user and posts  |

---

## 📁 Project Structure

```
src/
├── app.controller.ts            # Root controller (health, me, echo demo)
├── app.module.ts                # Root application module
├── app.service.ts
├── main.ts                      # Bootstrap entry (Fastify, Helmet, Compress, Docs)
├── auth/
│   ├── auth.ts                  # Better Auth configuration + Drizzle adapter
│   ├── auth.module.ts           # Global AuthModule
│   └── auth.service.ts          # Typed AuthService class
├── config/
│   ├── env.ts                   # Type-safe env schema (@t3-oss/env-core + Zod)
│   ├── config.service.ts        # AppConfigService wrapper
│   └── config.module.ts         # Global AppConfigModule
├── database/
│   ├── database.service.ts      # Drizzle + Postgres.js connection pool
│   ├── database.module.ts       # Global DatabaseModule
│   ├── seed.ts                  # Database seeding script
│   └── schema/
│       ├── auth.schema.ts       # Better Auth tables (user, session, account, etc.)
│       ├── posts.schema.ts      # Posts table & relations
│       └── index.ts             # Schema barrel exports
├── common/
│   ├── decorators/
│   │   ├── bypass-transform.decorator.ts
│   │   └── response-message.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   └── interfaces/
│       └── response.interface.ts
├── health/
│   ├── health.controller.ts     # /health probe (Drizzle ping)
│   └── health.module.ts
└── posts/
    ├── dto/
    │   ├── create-post.dto.ts   # Zod validation schema
    │   └── update-post.dto.ts
    ├── posts.controller.ts      # Protected & Public CRUD routes
    ├── posts.service.ts         # Drizzle ORM queries
    └── posts.module.ts
```

---

## 🔐 Authentication & Authorization Guide

Routes are protected by default with `@thallesp/nestjs-better-auth`. Use decorators to customize access:

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common'
import {
  AllowAnonymous,
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth'

@Controller('example')
export class ExampleController {
  // Public endpoint
  @AllowAnonymous()
  @Get('public')
  publicRoute() {
    return 'Anyone can access'
  }

  // Protected endpoint with access to current session
  @Get('profile')
  getProfile(@Session() session: UserSession) {
    return session.user
  }

  // Admin-only endpoint
  @Roles(['admin'])
  @Get('admin')
  adminRoute() {
    return 'Admin only'
  }
}
```

---

## 🌐 Environment Variables

| Variable                   | Description                                                   | Default                                                 |
| :------------------------- | :------------------------------------------------------------ | :------------------------------------------------------ |
| `NODE_ENV`                 | Application environment (`development`, `production`, `test`) | `development`                                           |
| `PORT`                     | HTTP port                                                     | `3000`                                                  |
| `DATABASE_URL`             | PostgreSQL connection string                                  | `postgresql://postgres:postgres@localhost:5432/nest_db` |
| `DATABASE_MAX_CONNECTIONS` | Max connection pool size                                      | `10`                                                    |
| `BETTER_AUTH_SECRET`       | Secret key for Better Auth tokens (min 32 chars)              | dev default                                             |
| `BETTER_AUTH_URL`          | Base URL of Better Auth                                       | `http://localhost:3000`                                 |
| `TRUSTED_ORIGINS`          | Comma-separated CORS and CSRF allowed origins                 | `http://localhost:3000,http://localhost:5173`           |
| `COOKIE_DOMAIN`            | Optional root domain for cross-subdomain cookies              | undefined                                               |
| `ENABLE_DOCS`              | Force-enable Scalar API docs in production                    | `false`                                                 |

---

## 📄 License

MIT

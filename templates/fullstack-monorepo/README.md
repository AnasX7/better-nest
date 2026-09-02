# NestJS v12 + Next.js 16 Turborepo Monorepo

A modern, high-performance **Fullstack Monorepo** powered by **Turborepo**, **NestJS v12 (Fastify & Rspack)**, **Next.js 16 (App Router, Turbopack, React 19.2.8 & React Compiler 1.0.0)**, **Tailwind CSS v4**, **shadcn/ui**, **Drizzle ORM**, **Better Auth**, and modular `@repo/*` packages.

---

## ⚡ Architecture & Monorepo Structure

```
nest-next-monorepo/
├── apps/
│   ├── server/                  # NestJS v12 backend (Fastify, Rspack, Pino, Scalar docs) - port 3001
│   └── web/                     # Next.js 16 frontend (React 19, Tailwind v4, TanStack Query, Better Auth) - port 3000
│
├── packages/
│   ├── env/                     # Type-safe env validation (@repo/env/server & @repo/env/web)
│   ├── db/                      # Centralized Drizzle ORM schema, client factory & migrations (@repo/db)
│   ├── auth/                    # Server Better Auth instance with Drizzle adapter (@repo/auth)
│   ├── contracts/               # Pure Zod schemas, DTOs & response interfaces (@repo/contracts)
│   ├── api/                     # Dedicated typed ApiClient consuming contracts & web env (@repo/api)
│   ├── ui/                      # Centralized shadcn UI components & Tailwind v4 styling (@repo/ui)
│   └── tsconfig/                # Shared TypeScript base configs (@repo/tsconfig)
│
├── turbo.json                   # Turborepo 2.x pipeline orchestration
├── package.json                 # Bun workspace configuration
├── docker-compose.yml           # Production Docker Compose orchestration
└── .oxfmtrc.json                # Monorepo-wide code formatter (no semicolons)
```

---

## 🚀 Key Highlights

1. **📦 Modular Package Separation**:
   - **`@repo/env`**: Zero duplicate environment schemas. Server env is isolated from client env, with `SKIP_ENV_VALIDATION=1` for Docker builds.
   - **`@repo/db`**: Database schemas, relations, client factory, and migration scripts in one package.
   - **`@repo/auth`**: Single-source server Better Auth instance with Drizzle adapter, `bearer()`, and `admin()` plugins.
   - **`@repo/contracts`**: Pure Zod validation schemas and DTO types.
   - **`@repo/api`**: Type-safe API client and SDK.
   - **`@repo/ui`**: Centralized shadcn UI components styled with Tailwind CSS v4.

2. **⚡ Ultra-Fast Build System**:
   - `apps/server`: Compiled in **~40ms** using [@rspack/core](https://rspack.dev).
   - `apps/web`: Next.js 16 with Turbopack and React 19 Compiler 1.0.0.
   - Turborepo 2.x topological dependency builds and caching.

3. **🐳 Production Docker & Container Orchestration**:
   - Multi-stage Dockerfiles with BuildKit cache mounts and `node:22-alpine` LTS runners with non-root user `USER node`.
   - Next.js Standalone build (~150MB container).
   - Zero-dependency healthchecks with automatic startup dependencies (`web` &rarr; `server` &rarr; `postgres`).

4. **🪵 Enterprise Observability & Security**:
   - Pino structured JSON streaming in production and colorized pretty-printing in development.
   - `@fastify/helmet`, `@fastify/compress`, `@nestjs/throttler`, Scalar Swagger docs.

---

## 🛠️ Getting Started

### 1. Prerequisites

- [Bun](https://bun.sh) (v1.2+)
- [Docker](https://www.docker.com) (for local PostgreSQL)

### 2. Installation & Database Setup

```bash
# Clone and enter the monorepo
cd nest-next-monorepo

# Install dependencies across all workspaces
bun install

# Start PostgreSQL container
docker compose up postgres -d

# Push database schema & seed initial data
bun run --filter @repo/db db:push
bun run --filter @repo/db db:seed
```

### 3. Start Fullstack Development

Run both the Next.js frontend (`:3000`) and NestJS backend (`:3001`) simultaneously:

```bash
bun run dev
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Interactive Scalar API Docs**: [http://localhost:3001/docs](http://localhost:3001/docs)

---

## 📜 Monorepo Scripts (Turborepo)

| Command                | Description                                                        |
| :--------------------- | :----------------------------------------------------------------- |
| `bun run dev`          | Starts all apps in watch mode with Turbo                           |
| `bun run build`        | Builds all packages and applications with topological dependencies |
| `bun run check-types`  | Type-checks all packages with `tsc --noEmit`                       |
| `bun run lint`         | Lints all packages with Oxlint                                     |
| `bun run format`       | Formats the whole monorepo with Oxfmt (no semicolons)              |
| `bun run format:check` | Verifies code formatting                                           |
| `bun run test`         | Runs unit tests across all workspaces                              |
| `bun run test:e2e`     | Runs E2E tests across all workspaces                               |

---

## 📄 License

MIT

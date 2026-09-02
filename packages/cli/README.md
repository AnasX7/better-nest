# create-better-nest

The ultimate CLI tool for scaffolding modern, production-ready NestJS applications. Whether you need a standalone backend or a fullstack monorepo with end-to-end type safety, `create-better-nest` has you covered.

## ✨ Features

- 🏗️ **Production-Ready Templates:**
  - **API Backend:** High-performance NestJS v12 + Fastify + Drizzle ORM (PostgreSQL) + Better Auth + Scalar OpenAPI docs + Pino logging.
  - **Fullstack Monorepo:** Turborepo monorepo with NestJS server + Next.js App Router + shadcn/ui + Tailwind CSS v4 + Better Auth.
- ⚡ **Lightning Fast Tooling:** Built with **Oxlint** & **Oxfmt** (Rust-based linter and formatter) and **Vitest**.
- 🧰 **Multi-Package Manager Support:** Native support for **Bun**, **pnpm**, and **npm**.
- 🧩 **Modular Addons Engine:**
  - **Husky & lint-staged:** Pre-commit Git hooks for automated linting & formatting.
  - **Docker:** Multi-stage production Dockerfiles & Docker Compose (Postgres).
  - **AI Agent / MCP:** Model Context Protocol configuration for Claude Code, Antigravity, and Cursor.
- 🚀 **Bundled with tsdown:** Built on Rolldown & Oxc for ultra-fast startup and execution.

## 🚀 Quick Start

```bash
# Using Bun (recommended)
bun create better-nest@latest

# Using pnpm
pnpm create better-nest@latest

# Using npm
npx create-better-nest@latest
```

You can also pass flags directly for headless / CI scaffolding:

```bash
bun create better-nest@latest my-app \
  --template api \
  --pm bun \
  --git \
  --docker \
  --husky \
  --mcp \
  --install
```

## 🤝 Contributing

We welcome contributions! This repository is a monorepo containing the CLI tool and the templates.

1. Clone the repo
2. Run `bun install`
3. Build the CLI:
   ```bash
   bun run build
   ```
4. Test the CLI locally:
   ```bash
   bun run cli
   ```

## ❤️ Acknowledgements & Inspiration

`create-better-nest` is inspired by the developer experience of modern fullstack scaffolding tools:

- [**create-better-t-stack**](https://github.com/AmanVarshney01/create-better-t-stack) by [Aman Varshney](https://github.com/AmanVarshney01): For pioneering the modern modular stack builder pattern and addons architecture.
- [**create-t3-app**](https://create.t3.gg/): For popularizing end-to-end type safety and minimalist stack composition.

## 📄 License

MIT

# create-better-nest

The ultimate CLI tool for scaffolding modern, production-ready NestJS applications. Whether you need a simple backend or a full-stack monorepo with end-to-end type safety, `create-better-nest` has you covered.

## ✨ Features

- 🏗️ **Three Powerful Templates:**
    - **Monorepo (oRPC):** The cutting edge. NestJS + Next.js with complete type safety from backend to frontend using oRPC.
    - **Monorepo (Basic):** A solid foundation using Turbo, NestJS, and Next.js.
    - **Standalone Backend:** A clean, pre-configured NestJS setup with Prisma, Swagger, and Docker.
- 🚀 **Modern Tooling:** Pre-configured with `pnpm`, `Turborepo`, `Prisma`, `Zod`, and `Better Auth`.
- 🛡️ **Best Practices:** Strict TypeScript configs, ESLint, and organized project structures out of the box.

## 🚀 Quick Start

Run the magic command:

```bash
npm create better-nest@latest
```

Follow the interactive prompts to choose your preferred architecture and project name.

## 📦 What you get

### 1. Monorepo (oRPC)
Perfect for teams wanting tight integration between backend and frontend.
- **Stack:** NestJS, Next.js, Turborepo, oRPC.
- **Highlights:** Define your API contract once, and get fully typed clients on the frontend automatically.

### 2. Monorepo (Basic)
The industry standard for full-stack TypeScript.
- **Stack:** NestJS, Next.js, Turborepo.
- **Highlights:** Shared UI libraries, shared types, and shared ESLint configs.

### 3. Standalone Backend
For when you just need a powerful API.
- **Stack:** NestJS, Prisma, Swagger.
- **Highlights:** Clean architecture, Docker-ready, and set up for scale.

## 🔧 Requirements

- Node.js >= 18
- pnpm (The generated projects rely on pnpm workspaces)

## 🤝 Contributing

We welcome contributions! This repository is a monorepo containing the CLI tool and the templates.

1.  Clone the repo
2.  Run `pnpm install`
3.  Test the CLI locally:
    ```bash
    pnpm --filter create-better-nest cli
    ```

## 📄 License

MIT

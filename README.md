# Better Nest (Source Repository)

[![npm version](https://badge.fury.io/js/create-better-nest.svg)](https://www.npmjs.com/package/create-better-nest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

This is the source repository for the `create-better-nest` CLI tool and its associated templates.

If you are looking to **use** the tool, simply run:

```bash
# Using Bun (recommended)
bun create better-nest@latest

# Using pnpm
pnpm create better-nest@latest

# Using npm
npx create-better-nest@latest
```

## 🏗️ Repository Structure

- **`packages/cli`**: The source code for the `create-better-nest` CLI tool (built with `tsdown` powered by Rolldown).
- **`templates/`**: The production templates that users scaffold:
  - `api`: Standalone NestJS v12 + Fastify + Drizzle ORM + Better Auth + Scalar + Pino + Oxlint/Oxfmt.
  - `fullstack-monorepo`: Turborepo with NestJS API + Next.js App Router + shadcn/ui + Better Auth.

## 👩‍💻 Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.3
- Node.js >= 20

### Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Build all packages with Turborepo:

   ```bash
   bun run build
   ```

3. Run linting & formatting checks (Oxlint & Oxfmt):

   ```bash
   bun run check
   ```

4. Test the CLI locally:
   ```bash
   bun run --filter create-better-nest cli
   ```

## 🚀 Release Process

### Templates

The templates are pulled directly from the `main` branch of this repository by the CLI (using `giget`).
**Any changes pushed to `templates/` on the `main` branch are immediately available to users.** No NPM publish is required for template updates.

### CLI Tool

To release a new version of the CLI (`create-better-nest`):

1. Navigate to the CLI package:

   ```bash
   cd packages/cli
   ```

2. Bump the version in `package.json`:

   ```bash
   npm version patch # or minor, major
   ```

3. Publish to NPM (ensure you are logged in):

   ```bash
   npm publish
   ```

4. Push the version tag to GitHub:
   ```bash
   git push origin main --tags
   ```

## ❤️ Acknowledgements & Inspiration

`better-nest` is inspired by the developer experience of modern fullstack scaffolding tools:

- [**create-better-t-stack**](https://github.com/AmanVarshney01/create-better-t-stack) by [Aman Varshney](https://github.com/AmanVarshney01): For pioneering the modern modular stack builder pattern and addons architecture.
- [**create-t3-app**](https://create.t3.gg/): For popularizing end-to-end type safety and minimalist stack composition.

Our mission is to bring that same high-velocity developer experience (Fastify, Drizzle, Better Auth, Oxlint, Vitest, Turborepo) to the massive NestJS community.

## 📄 License

MIT

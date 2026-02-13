# Better Nest Monorepo (oRPC Edition)

Welcome to your new **Better Nest** monorepo powered by **oRPC**! This template takes type safety to the next level by ensuring your frontend client is perfectly synchronized with your backend contract.

## 🚀 Key Features

- **End-to-End Type Safety:** Types flow automatically from your API contract to your frontend client. No manual type generation required.
- **oRPC:** A modern RPC library for TypeScript that feels like magic.
- **Turborepo & pnpm:** Blazing fast builds and package management.
- **NestJS & Next.js:** The industry standard for full-stack TypeScript.

## 📂 Project Structure

```text
.
├── apps
│   ├── server          # NestJS API implementing the contract
│   └── web             # Next.js frontend consuming the contract
└── packages
    ├── orpc            # The API Contract (Source of Truth)
    ├── auth            # Shared authentication
    ├── db              # Prisma database setup
    └── types           # Shared Zod schemas
```

## 🪄 How oRPC Works Here

1.  **Define Contract (`packages/orpc`)**:
    You define your API routes and input/output schemas using Zod in `packages/orpc/src/index.ts`.
    ```typescript
    export const contract = populateContractRouterPaths({
      hello: { get: getHelloRoute }
    });
    ```

2.  **Implement Server (`apps/server`)**:
    Your NestJS controllers implement the contract using the `@Implement` decorator.
    ```typescript
    @Implement(contract.hello.get)
    getHello() { ... }
    ```

3.  **Consume Client (`apps/web`)**:
    Your frontend uses the type-safe client which knows exactly what your server expects and returns.
    ```typescript
    const data = await api.hello.get();
    //    ^? typed as { message: string }
    ```

## 🛠️ Quick Start

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Database Setup:**
    ```bash
    pnpm db:migrate
    pnpm db:generate
    ```

3.  **Start Development:**
    ```bash
    pnpm dev
    ```

## 📦 Adding a New Endpoint

1.  Go to `packages/orpc` and add a new route definition.
2.  Go to `apps/server` and implement the logic for that route.
3.  Go to `apps/web` and call `api.yourNewRoute()`.
    *TypeScript will guide you through every step!*

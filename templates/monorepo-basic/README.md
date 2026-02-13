# Better Nest Monorepo

Welcome to your new **Better Nest** monorepo! This starter kit provides a production-ready foundation for building full-stack applications with extreme type safety and developer experience.

## 🚀 Tech Stack

- **Monorepo Manager:** [Turborepo](https://turbo.build/)
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Backend:** [NestJS](https://nestjs.com/) (Fastify adapter)
- **Frontend:** [Next.js](https://nextjs.org/) (App Router)
- **Database:** [Prisma ORM](https://www.prisma.io/)
- **Authentication:** [Better Auth](https://better-auth.com/)
- **Validation:** [Zod](https://zod.dev/)

## 📂 Project Structure

```text
.
├── apps
│   ├── server          # NestJS API application
│   └── web             # Next.js frontend application
└── packages
    ├── auth            # Shared authentication logic & types
    ├── db              # Prisma schema and client
    ├── eslint-config   # Shared ESLint configurations
    ├── types           # Shared Zod schemas and TypeScript interfaces
    ├── typescript-config # Shared tsconfig bases
    └── ui              # Shared React component library
```

## 🛠️ Quick Start

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Set up Environment Variables:**
    Copy `.env.example` to `.env` in `apps/server` and `apps/web`.

3.  **Start Database:**
    You can start a local Postgres instance using Docker (optional if you have one running):
    ```bash
    cd packages/db
    docker-compose up -d
    ```

4.  **Run Migrations:**
    ```bash
    pnpm db:migrate
    pnpm db:generate
    ```

5.  **Start Development Server:**
    ```bash
    pnpm dev
    ```
    - Web: [http://localhost:3001](http://localhost:3001)
    - Server: [http://localhost:3000](http://localhost:3000)

## 📦 Shared Packages

- **@repo/db**: Exports the instantiated `PrismaClient`. All database operations should originate here.
- **@repo/auth**: Centralized auth configuration using Better Auth.
- **@repo/ui**: A dummy UI library to demonstrate shared components.
- **@repo/types**: The source of truth for your data shapes. Define Zod schemas here and import them in both `web` and `server` for type safety.

## 🤝 Contributing

This project uses [pnpm workspaces](https://pnpm.io/workspaces). Add dependencies to specific apps/packages using the filter flag:

```bash
pnpm add axios --filter web
pnpm add -D jest --filter server
```

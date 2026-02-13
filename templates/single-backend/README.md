# Better Nest Backend

A robust, production-ready **NestJS** starter template for standalone backend applications.

## 🌟 Features

- **Framework:** [NestJS](https://nestjs.com/) (Standard Express adapter)
- **Database:** Prisma ORM with PostgreSQL
- **Documentation:** Swagger/OpenAPI auto-generated
- **Configuration:** Strictly typed environment variables with Zod
- **Testing:** Vitest configured for Unit and E2E tests
- **Docker:** Ready-to-deploy Dockerfile and docker-compose setup

## 🚀 Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Database

Start a local PostgreSQL container:
```bash
docker-compose up -d
```

Run migrations:
```bash
pnpm prisma migrate dev
```

### 4. Running the App

```bash
# Development mode
pnpm start:dev

# Production mode
pnpm start:prod
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)
- **JSON Spec:** [http://localhost:3000/api-json](http://localhost:3000/api-json)

## 🧪 Testing

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e
```

## 🐳 Docker

Build the image:
```bash
docker build -t my-nest-app .
```

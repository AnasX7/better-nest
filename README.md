# Better Nest (Source Repository)

[![npm version](https://badge.fury.io/js/create-better-nest.svg)](https://www.npmjs.com/package/create-better-nest)

This is the source repository for the `create-better-nest` CLI tool and its associated templates.

If you are looking to **use** the tool, simply run:
```bash
npm create better-nest@latest
```

## 🏗️ Repository Structure

- **`packages/cli`**: The source code for the CLI tool itself.
- **`templates/`**: The source code for the templates that users download.
    - `monorepo-basic`: Standard Turbo + Nest + Next setup.
    - `monorepo-orpc`: Turbo + Nest + Next + oRPC setup.
    - `single-backend`: Standalone NestJS setup.

## 👩‍💻 Development

### Prerequisites
- Node.js >= 18
- pnpm

### Setup
1.  Install dependencies:
    ```bash
    pnpm install
    ```

2.  Run the CLI in development mode (watch mode):
    ```bash
    pnpm --filter create-better-nest dev
    ```

3.  Test the CLI interactively:
    ```bash
    pnpm --filter create-better-nest cli
    ```

## 🚀 Release Process

### Templates
The templates are pulled directly from the `main` branch of this repository by the CLI (using `tiged`).
**Any changes pushed to `templates/` on the `main` branch are immediately available to users.** No NPM publish is required for template updates.

### CLI Tool
To release a new version of the CLI (`create-better-nest`):

1.  Navigate to the CLI package:
    ```bash
    cd packages/cli
    ```

2.  Bump the version in `package.json`:
    ```bash
    npm version patch # or minor, major
    ```

3.  Publish to NPM (ensure you are logged in):
    ```bash
    npm publish
    ```

4.  Push the version tag to GitHub:
    ```bash
    git push origin main --tags
    ```

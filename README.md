# Better Nest (Source Repository)

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

### Release Process
The templates are pulled directly from the `main` branch of this repository by the CLI (using `tiged`). Any changes pushed to `templates/` on `main` are immediately available to users.

The CLI package itself needs to be published to NPM to receive updates.

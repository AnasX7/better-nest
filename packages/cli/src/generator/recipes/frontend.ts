import path from 'path'
import fs from 'fs-extra'
import type { ProjectConfig, Recipe } from '../types'

export const frontendRecipe: Recipe = {
  id: 'frontend',
  name: 'Frontend Framework',
  async apply(config: ProjectConfig) {
    const isMonorepo = config.arch === 'monorepo'
    const webAppDir = path.join(config.targetDir, 'apps/web')
    const uiPkgDir = path.join(config.targetDir, 'packages/ui')

    if (isMonorepo) {
      if (config.frontend === 'none') {
        // Pure backend monorepo: remove apps/web and packages/ui
        if (await fs.pathExists(webAppDir)) await fs.remove(webAppDir)
        if (await fs.pathExists(uiPkgDir)) await fs.remove(uiPkgDir)
        return
      }

      if (config.frontend === 'tanstack-router') {
        // Swap apps/web from Next.js to TanStack Router + Vite
        if (await fs.pathExists(webAppDir)) {
          await fs.remove(webAppDir)
        }
        await createTanStackRouterApp(webAppDir, { isMonorepo: true })
      }
    } else {
      // Standalone architecture
      if (config.frontend === 'tanstack-router') {
        const clientDir = path.join(config.targetDir, 'client')
        await createTanStackRouterApp(clientDir, { isMonorepo: false })

        // Add client scripts to root package.json
        const rootPkgPath = path.join(config.targetDir, 'package.json')
        if (await fs.pathExists(rootPkgPath)) {
          const pkg = await fs.readJson(rootPkgPath)
          pkg.scripts = pkg.scripts || {}
          pkg.scripts['dev:client'] = 'cd client && bun run dev'
          pkg.scripts['build:client'] = 'cd client && bun run build'
          await fs.writeJson(rootPkgPath, pkg, { spaces: 2 })
        }
      }
    }
  },
}

async function createTanStackRouterApp(
  appDir: string,
  options: { isMonorepo: boolean },
) {
  await fs.ensureDir(appDir)

  // 1. package.json
  const pkg = {
    name: options.isMonorepo ? '@repo/web' : 'client',
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    dependencies: {
      '@tanstack/react-router': '^1.114.0',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      clsx: '^2.1.1',
      'tailwind-merge': '^3.0.1',
      lucide_react: '^0.475.0',
    },
    devDependencies: {
      '@tanstack/router-plugin': '^1.114.0',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^4.3.4',
      tailwindcss: '^4.0.6',
      typescript: '^5.7.3',
      vite: '^6.1.0',
    },
  }

  await fs.writeJson(path.join(appDir, 'package.json'), pkg, { spaces: 2 })

  // 2. vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
`
  await fs.writeFile(path.join(appDir, 'vite.config.ts'), viteConfig, 'utf8')

  // 3. tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      useDefineForClassFields: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
  }
  await fs.writeJson(path.join(appDir, 'tsconfig.json'), tsconfig, {
    spaces: 2,
  })

  // 4. index.html
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Better Nest + TanStack Router</title>
  </head>
  <body class="min-h-screen bg-neutral-950 text-neutral-50 antialiased font-sans">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  await fs.writeFile(path.join(appDir, 'index.html'), indexHtml, 'utf8')

  // 5. Source code
  const srcDir = path.join(appDir, 'src')
  const routesDir = path.join(srcDir, 'routes')
  await fs.ensureDir(routesDir)

  // src/main.tsx
  const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
`
  await fs.writeFile(path.join(srcDir, 'main.tsx'), mainTsx, 'utf8')

  // src/index.css
  const indexCss = `@import "tailwindcss";
`
  await fs.writeFile(path.join(srcDir, 'index.css'), indexCss, 'utf8')

  // src/routes/__root.tsx
  const rootRoute = `import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-emerald-400">Better-Nest</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-mono">
            TanStack Router
          </span>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
          <Link to="/" className="text-neutral-400 hover:text-white transition">
            Home
          </Link>
          <a
            href="http://localhost:3001/docs"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-white transition"
          >
            API Docs (Scalar)
          </a>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  ),
})
`
  await fs.writeFile(path.join(routesDir, '__root.tsx'), rootRoute, 'utf8')

  // src/routes/index.tsx
  const indexRoute = `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
        Modern NestJS with <span className="text-emerald-400">TanStack Router</span>
      </h1>
      <p className="mt-4 max-w-xl text-neutral-400 sm:text-lg">
        Fullstack type safety powered by TanStack Router, Vite, Fastify, and Drizzle ORM.
      </p>
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <a
          href="http://localhost:3001/health"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400 transition"
        >
          Check API Health
        </a>
        <a
          href="http://localhost:3001/docs"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition"
        >
          Explore OpenAPI Docs
        </a>
      </div>
    </div>
  )
}
`
  await fs.writeFile(path.join(routesDir, 'index.tsx'), indexRoute, 'utf8')
}

#!/usr/bin/env node
import {
  intro,
  outro,
  text,
  select,
  multiselect,
  confirm,
  isCancel,
  cancel,
  spinner,
  note,
} from '@clack/prompts'
import { program } from 'commander'
import pc from 'picocolors'
import path from 'path'
import fs from 'fs-extra'
import { execSync } from 'child_process'
import { printBanner } from './utils/banner'
import {
  detectPackageManager,
  getInstallCommand,
  getRunCommand,
  type PackageManager,
} from './utils/pm'
import { initGit, setupHusky } from './utils/git'
import { getAddonOptions, getDefaultAddonIds } from './addons'
import {
  executeGenerator,
  type Architecture,
  type Frontend,
  type HttpAdapter,
  type Database,
  type Orm,
  type AuthProvider,
  type ApiDocs,
  type ProjectConfig,
} from './generator'

async function main() {
  printBanner()

  program
    .name('better-nest')
    .description(
      'CLI to scaffold production-grade NestJS applications with modern TypeScript',
    )
    .argument('[dir]', 'Directory name to create project in')
    .option('--arch <architecture>', 'Architecture (standalone, monorepo)')
    .option(
      '--frontend <frontend>',
      'Frontend framework (next, tanstack-start, tanstack-router, none)',
    )
    .option('--http <httpAdapter>', 'HTTP platform adapter (fastify, express)')
    .option('--db <database>', 'Database (postgres, sqlite, none)')
    .option('--orm <orm>', 'ORM (drizzle, none)')
    .option('--auth <authProvider>', 'Authentication (better-auth, none)')
    .option('--docs <apiDocs>', 'API documentation (scalar, swagger, none)')
    .option('--pm <packageManager>', 'Package manager (bun, pnpm, npm)')
    .option(
      '-a, --addons <addons...>',
      'Addons to include (husky, docker, mcp)',
    )
    .option('--no-addons', 'Disable all addons')
    .option('--docker', 'Include Docker configuration')
    .option('--no-docker', 'Exclude Docker configuration')
    .option('--husky', 'Setup Husky pre-commit hooks')
    .option('--no-husky', 'Skip Husky setup')
    .option('--mcp', 'Setup AI Agent / MCP configuration')
    .option('--no-mcp', 'Skip MCP configuration')
    .option('--git', 'Initialize a git repository')
    .option('--no-git', 'Skip git repository initialization')
    .option('--install', 'Install dependencies')
    .option('--no-install', 'Skip dependency installation')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .version('0.1.0')

  program.parse()

  const cliArgs = program.args
  const cliOpts = program.opts()
  const defaultPm = detectPackageManager()

  intro(pc.bgCyan(pc.black(' create-better-nest ')))

  // 1. Resolve Project Name / Directory
  let projectName = cliArgs[0]
  if (!projectName) {
    if (cliOpts.yes) {
      projectName = 'my-nest-app'
    } else {
      const response = await text({
        message: 'What is the name of your project?',
        placeholder: 'my-nest-app',
        defaultValue: 'my-nest-app',
        validate(value) {
          if (!value || value.trim().length === 0)
            return 'Project name is required'
          if (!/^[a-zA-Z0-9-_.]+$/.test(value))
            return 'Project name can only contain letters, numbers, hyphens, and underscores'
        },
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      projectName = response
    }
  }

  const targetDir = path.resolve(process.cwd(), projectName)

  if (await fs.pathExists(targetDir)) {
    const files = await fs.readdir(targetDir)
    if (files.length > 0) {
      cancel(`Directory "${projectName}" already exists and is not empty.`)
      process.exit(1)
    }
  }

  // 2. Resolve Architecture
  let arch: Architecture = cliOpts.arch as Architecture
  if (!arch || !['standalone', 'monorepo'].includes(arch)) {
    if (cliOpts.yes) {
      arch = 'standalone'
    } else {
      const response = await select({
        message: 'Select project architecture:',
        options: [
          {
            value: 'standalone',
            label: 'Standalone Backend API / Fullstack',
            hint: 'Single package NestJS application',
          },
          {
            value: 'monorepo',
            label: 'Turborepo Monorepo',
            hint: 'Multi-package workspace with apps/ and packages/',
          },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      arch = response as Architecture
    }
  }

  // 3. Resolve Frontend
  let frontend: Frontend = cliOpts.frontend as Frontend
  const validFrontends =
    arch === 'monorepo'
      ? ['next', 'tanstack-start', 'none']
      : ['none', 'tanstack-router']

  if (!frontend || !validFrontends.includes(frontend)) {
    if (cliOpts.yes) {
      frontend = arch === 'monorepo' ? 'next' : 'none'
    } else {
      const options =
        arch === 'monorepo'
          ? [
              {
                value: 'next',
                label: 'Next.js 15',
                hint: 'App Router + shadcn/ui + Tailwind v4',
              },
              {
                value: 'tanstack-start',
                label: 'TanStack Start',
                hint: 'Fullstack SSR React framework + TanStack Router',
              },
              { value: 'none', label: 'None', hint: 'Pure backend monorepo' },
            ]
          : [
              { value: 'none', label: 'None', hint: 'API only' },
              {
                value: 'tanstack-router',
                label: 'TanStack Router',
                hint: 'Client SPA with Vite + React + shadcn/ui',
              },
            ]

      const response = await select({
        message: 'Select frontend framework:',
        options,
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      frontend = response as Frontend
    }
  }

  // 4. Resolve HTTP Platform Adapter
  let http: HttpAdapter = cliOpts.http as HttpAdapter
  if (!http || !['fastify', 'express'].includes(http)) {
    if (cliOpts.yes) {
      http = 'fastify'
    } else {
      const response = await select({
        message: 'Select HTTP platform adapter:',
        options: [
          {
            value: 'fastify',
            label: 'Fastify',
            hint: 'Recommended - ultra-high throughput',
          },
          {
            value: 'express',
            label: 'Express',
            hint: 'Standard NestJS compatibility',
          },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      http = response as HttpAdapter
    }
  }

  // 5. Resolve Database & ORM
  let db: Database = cliOpts.db as Database
  if (!db || !['postgres', 'sqlite', 'none'].includes(db)) {
    if (cliOpts.yes) {
      db = 'postgres'
    } else {
      const response = await select({
        message: 'Select Database:',
        options: [
          {
            value: 'postgres',
            label: 'PostgreSQL',
            hint: 'Recommended with Drizzle ORM',
          },
          {
            value: 'sqlite',
            label: 'SQLite',
            hint: 'Local file-based, zero configuration',
          },
          { value: 'none', label: 'None', hint: 'Stateless / In-memory store' },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      db = response as Database
    }
  }

  const orm: Orm = db === 'none' ? 'none' : 'drizzle'

  // 6. Resolve Authentication
  let auth: AuthProvider = cliOpts.auth as AuthProvider
  if (!auth || !['better-auth', 'none'].includes(auth)) {
    if (cliOpts.yes) {
      auth = 'better-auth'
    } else {
      const response = await select({
        message: 'Select Authentication:',
        options: [
          {
            value: 'better-auth',
            label: 'Better Auth',
            hint: 'Comprehensive TypeScript auth library',
          },
          { value: 'none', label: 'None', hint: 'Skip authentication setup' },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      auth = response as AuthProvider
    }
  }

  // 7. Resolve API Documentation
  let docs: ApiDocs = cliOpts.docs as ApiDocs
  if (!docs || !['scalar', 'swagger', 'none'].includes(docs)) {
    if (cliOpts.yes) {
      docs = 'scalar'
    } else {
      const response = await select({
        message: 'Select API Documentation:',
        options: [
          {
            value: 'scalar',
            label: 'Scalar',
            hint: 'Recommended - Modern interactive client',
          },
          {
            value: 'swagger',
            label: 'Swagger UI',
            hint: 'Classic Swagger interactive UI',
          },
          { value: 'none', label: 'None', hint: 'Skip API documentation' },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      docs = response as ApiDocs
    }
  }

  // 8. Resolve Package Manager
  let pm: PackageManager = cliOpts.pm as PackageManager
  if (!pm || !['bun', 'pnpm', 'npm'].includes(pm)) {
    if (cliOpts.yes) {
      pm = defaultPm
    } else {
      const response = await select({
        message: 'Select package manager:',
        options: [
          {
            value: 'bun',
            label: 'Bun',
            hint: defaultPm === 'bun' ? 'detected' : undefined,
          },
          {
            value: 'pnpm',
            label: 'pnpm',
            hint: defaultPm === 'pnpm' ? 'detected' : undefined,
          },
          {
            value: 'npm',
            label: 'npm',
            hint: defaultPm === 'npm' ? 'detected' : undefined,
          },
        ],
        initialValue: defaultPm,
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      pm = response as PackageManager
    }
  }

  // 9. Resolve Git
  let shouldGit: boolean = cliOpts.git !== undefined ? cliOpts.git : true
  if (cliOpts.git === undefined && !cliOpts.yes) {
    const response = await confirm({
      message: 'Initialize a Git repository?',
      initialValue: true,
    })
    if (isCancel(response)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    shouldGit = response
  }

  // 10. Resolve Addons
  const hasSpecificAddonFlag =
    cliOpts.docker !== undefined ||
    cliOpts.husky !== undefined ||
    cliOpts.mcp !== undefined ||
    cliOpts.addons !== undefined

  let selectedAddons: string[] = []
  if (cliOpts.addons === false) {
    selectedAddons = []
  } else if (Array.isArray(cliOpts.addons)) {
    selectedAddons = cliOpts.addons
  } else if (cliOpts.yes || hasSpecificAddonFlag) {
    selectedAddons = getDefaultAddonIds()
  } else {
    const initialAddons = getDefaultAddonIds().filter((id) => {
      if (id === 'husky' && !shouldGit) return false
      return true
    })

    const response = await multiselect({
      message: 'Select addons to include:',
      options: getAddonOptions().filter((opt) => {
        if (opt.value === 'husky' && !shouldGit) return false
        return true
      }),
      initialValues: initialAddons,
      required: false,
    })

    if (isCancel(response)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    selectedAddons = response as string[]
  }

  // Flag overrides
  if (cliOpts.docker === false)
    selectedAddons = selectedAddons.filter((a) => a !== 'docker')
  if (cliOpts.docker === true && !selectedAddons.includes('docker'))
    selectedAddons.push('docker')
  if (cliOpts.husky === false || !shouldGit)
    selectedAddons = selectedAddons.filter((a) => a !== 'husky')
  if (cliOpts.husky === true && shouldGit && !selectedAddons.includes('husky'))
    selectedAddons.push('husky')
  if (cliOpts.mcp === false)
    selectedAddons = selectedAddons.filter((a) => a !== 'mcp')
  if (cliOpts.mcp === true && !selectedAddons.includes('mcp'))
    selectedAddons.push('mcp')

  // 11. Resolve Install
  let shouldInstall: boolean =
    cliOpts.install !== undefined ? cliOpts.install : true
  if (cliOpts.install === undefined && !cliOpts.yes) {
    const response = await confirm({
      message: `Install dependencies with ${pm}?`,
      initialValue: true,
    })
    if (isCancel(response)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    shouldInstall = response
  }

  // Project configuration object
  const projectConfig: ProjectConfig = {
    projectName,
    targetDir,
    pm,
    arch,
    frontend,
    http,
    db,
    orm,
    auth,
    docs,
    git: shouldGit,
    addons: selectedAddons,
  }

  // Scaffolding execution
  const s = spinner()
  s.start(
    pc.cyan(
      `Scaffolding ${arch} project with custom stack into ./${projectName}...`,
    ),
  )

  try {
    // Execute Recipe Generator
    await executeGenerator(projectConfig)

    // Initialize Git
    if (shouldGit) {
      s.message('Initializing Git repository...')
      initGit(targetDir)
    }

    // Install dependencies
    if (shouldInstall) {
      s.message(`Installing dependencies with ${pm}...`)
      try {
        execSync(getInstallCommand(pm), { cwd: targetDir, stdio: 'ignore' })
      } catch {
        // Continue if install fails (offline/network)
      }

      // Setup Husky hooks
      if (shouldGit && selectedAddons.includes('husky')) {
        s.message('Setting up Git hooks with Husky...')
        setupHusky(targetDir, pm)
      }
    }

    s.stop(pc.green('Project scaffolded successfully!'))

    const nextSteps = [
      `cd ${projectName}`,
      ...(shouldInstall ? [] : [getInstallCommand(pm)]),
      getRunCommand(pm, 'dev'),
    ]

    const summary = [
      pc.dim(`Architecture: ${pc.cyan(arch)}`),
      pc.dim(`Frontend: ${pc.cyan(frontend)}`),
      pc.dim(`HTTP Adapter: ${pc.cyan(http)}`),
      pc.dim(`Database & ORM: ${pc.cyan(`${db} + ${orm}`)}`),
      pc.dim(`Auth: ${pc.cyan(auth)}`),
      pc.dim(`Docs: ${pc.cyan(docs)}`),
      pc.dim(`Package Manager: ${pc.cyan(pm)}`),
      pc.dim(
        `Addons: ${pc.cyan(selectedAddons.length > 0 ? selectedAddons.join(', ') : 'none')}`,
      ),
      '',
      ...nextSteps.map((step) => pc.cyan(`  $ ${step}`)),
    ]

    note(summary.join('\n'), 'Project Stack & Next Steps:')

    outro(pc.bold(pc.green('Happy coding with Better-Nest! 🚀')))
  } catch (error) {
    s.stop(pc.red('Scaffolding failed.'))
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main().catch(console.error)

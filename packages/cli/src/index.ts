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
import { copyTemplate, type TemplateType } from './utils/template'
import { initGit, setupHusky } from './utils/git'
import { getAddonOptions, getDefaultAddonIds, runAddonEngine } from './addons'

async function main() {
  printBanner()

  program
    .name('better-nest')
    .description('CLI to scaffold production-grade NestJS applications')
    .argument('[dir]', 'Directory name to create project in')
    .option(
      '-t, --template <template>',
      'Template to use (api, fullstack-monorepo)',
    )
    .option('--pm <packageManager>', 'Package manager to use (bun, pnpm, npm)')
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

  // 1. Resolve Project Directory
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

  // 2. Resolve Template
  let template: TemplateType = cliOpts.template as TemplateType
  if (!template || !['api', 'fullstack-monorepo'].includes(template)) {
    if (cliOpts.yes) {
      template = 'api'
    } else {
      const response = await select({
        message: 'Select a template:',
        options: [
          {
            value: 'api',
            label: 'API Backend',
            hint: 'NestJS v12 + Fastify + Drizzle ORM + Better Auth + Scalar + Pino + Oxlint/Oxfmt',
          },
          {
            value: 'fullstack-monorepo',
            label: 'Fullstack Monorepo',
            hint: 'Turborepo + NestJS API + Next.js App Router + shadcn/ui + Better Auth',
          },
        ],
      })
      if (isCancel(response)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      template = response as TemplateType
    }
  }

  // 3. Resolve Package Manager
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

  // 4. Resolve Git
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

  // 5. Resolve Addons via Addon Engine
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

  // Apply explicit command-line flag overrides
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

  // 6. Resolve Install
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

  // Scaffolding execution
  const s = spinner()
  s.start(pc.cyan(`Scaffolding ${template} template into ./${projectName}...`))

  try {
    // Step A: Copy template files
    await copyTemplate({
      projectName,
      targetDir,
      template,
      pm,
    })

    // Step B: Initialize Git if opted in
    if (shouldGit) {
      s.message('Initializing Git repository...')
      initGit(targetDir)
    }

    // Step C: Run Addon Engine
    s.message('Applying selected addons...')
    await runAddonEngine({
      projectName,
      targetDir,
      template,
      pm,
      git: shouldGit,
      selectedAddons,
    })

    // Step D: Install dependencies
    if (shouldInstall) {
      s.message(`Installing dependencies with ${pm}...`)
      try {
        execSync(getInstallCommand(pm), { cwd: targetDir, stdio: 'ignore' })
      } catch {
        // Warning if install fails (offline, network, etc.)
      }

      // Step E: Setup Husky hooks if selected
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
      pc.dim(`Template: ${pc.cyan(template)}`),
      pc.dim(`Package Manager: ${pc.cyan(pm)}`),
      pc.dim(
        `Addons: ${pc.cyan(selectedAddons.length > 0 ? selectedAddons.join(', ') : 'none')}`,
      ),
      '',
      ...nextSteps.map((step) => pc.cyan(`  $ ${step}`)),
    ]

    note(summary.join('\n'), 'Project Summary & Next Steps:')

    outro(pc.bold(pc.green('Happy coding with Better-Nest! 🚀')))
  } catch (error) {
    s.stop(pc.red('Scaffolding failed.'))
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main().catch(console.error)

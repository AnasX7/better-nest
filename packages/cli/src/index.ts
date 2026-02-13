#!/usr/bin/env node
import {
  intro,
  outro,
  text,
  select,
  isCancel,
  cancel,
  spinner,
} from '@clack/prompts'
import { program } from 'commander'
import pc from 'picocolors'
import tiged from 'tiged'
import fs from 'fs-extra'
import path from 'path'
import { execSync } from 'child_process'

async function main() {
  program
    .name('better-nest')
    .description('CLI to scaffold better NestJS applications')
    .version('0.0.1')

  program.parse()

  intro(pc.bgCyan(pc.black(' better-nest ')))

  const projectName = await text({
    message: 'What is the name of your project?',
    placeholder: 'my-nest-app',
    defaultValue: 'my-nest-app',
  })

  if (isCancel(projectName)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const architecture = await select({
    message: 'Select the architecture:',
    options: [
      { value: 'monorepo', label: 'Monorepo' },
      { value: 'standalone', label: 'Standalone Backend' },
    ],
  })

  if (isCancel(architecture)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  let variant: string | symbol = 'basic'

  if (architecture === 'monorepo') {
    variant = await select({
      message: 'Select the monorepo variant:',
      options: [
        { value: 'basic', label: 'Basic (Standard)' },
        { value: 'orpc', label: 'With oRPC' },
      ],
    })

    if (isCancel(variant)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
  }

  const s = spinner()
  s.start('Scaffolding your project...')

  let templatePath = 'github:AnasX7/better-nest/templates'

  if (architecture === 'monorepo') {
    if (variant === 'orpc') {
      templatePath += '/monorepo-orpc'
    } else {
      templatePath += '/monorepo-basic'
    }
  } else {
    templatePath += '/single-backend'
  }

  try {
    const emitter = tiged(templatePath, {
      disableCache: true,
      force: true,
      verbose: false,
    })

    const projectDir = path.resolve(process.cwd(), projectName as string)
    await emitter.clone(projectDir)

    s.message('Configuring project...')

    const packageJsonPath = path.join(projectDir, 'package.json')
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath)
      pkg.name = projectName
      await fs.writeJson(packageJsonPath, pkg, { spaces: 2 })
    }

    s.message('Initializing git repository...')
    try {
      execSync('git init', { cwd: projectDir, stdio: 'ignore' })
    } catch (e) {
      // Ignore git init errors if git is not installed or configured
    }

    s.stop('Scaffolding complete!')

    outro(`You're all set! To get started, run:

  ${pc.green(`cd ${projectName}`)}
  ${pc.green('pnpm install')}
  ${pc.green('pnpm dev')}
`)
  } catch (error) {
    s.stop('Scaffolding failed.')
    cancel(`Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main().catch(console.error)

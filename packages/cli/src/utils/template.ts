import path from 'path'
import fs from 'fs-extra'
import { downloadTemplate } from 'giget'
import type { PackageManager } from './pm'

export type TemplateType = 'api' | 'fullstack-monorepo'

export interface ScaffoldOptions {
  projectName: string
  targetDir: string
  template: TemplateType
  pm: PackageManager
}

export async function copyTemplate(options: ScaffoldOptions): Promise<void> {
  const { projectName, targetDir, template, pm } = options

  // 1. Try local template resolution first (when developing locally or from monorepo)
  const candidateDirs = [
    path.resolve(__dirname, '../../../templates', template),
    path.resolve(__dirname, '../../templates', template),
    path.resolve(__dirname, '../templates', template),
  ]

  let foundLocalDir: string | null = null
  for (const dir of candidateDirs) {
    if (await fs.pathExists(dir)) {
      foundLocalDir = dir
      break
    }
  }

  if (foundLocalDir) {
    await fs.copy(foundLocalDir, targetDir)
  } else {
    // 2. Download from GitHub via giget
    await downloadTemplate(
      `github:AnasX7/better-nest/templates/${template}#main`,
      {
        dir: targetDir,
        force: true,
        offline: false,
      },
    )
  }

  // 3. Post-process package.json in target directory
  const rootPkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(rootPkgPath)) {
    const pkg = await fs.readJson(rootPkgPath)
    pkg.name = path.basename(projectName)

    // Update packageManager field
    if (pm === 'bun') {
      pkg.packageManager = 'bun@1.4.0'
    } else if (pm === 'pnpm') {
      pkg.packageManager = 'pnpm@10.33.0'
    } else {
      delete pkg.packageManager
    }

    await fs.writeJson(rootPkgPath, pkg, { spaces: 2 })
  }

  // 4. Clean up lockfile if not matching chosen package manager
  if (pm !== 'bun') {
    const bunLock = path.join(targetDir, 'bun.lock')
    if (await fs.pathExists(bunLock)) {
      await fs.remove(bunLock)
    }
  }

  // 5. Copy .env.example to .env if not exists
  const envExample = path.join(targetDir, '.env.example')
  const envFile = path.join(targetDir, '.env')
  if ((await fs.pathExists(envExample)) && !(await fs.pathExists(envFile))) {
    await fs.copy(envExample, envFile)
  }

  // For monorepos, check apps/server and apps/web for .env.example
  const serverEnvExample = path.join(targetDir, 'apps/server/.env.example')
  const serverEnvFile = path.join(targetDir, 'apps/server/.env')
  if (
    (await fs.pathExists(serverEnvExample)) &&
    !(await fs.pathExists(serverEnvFile))
  ) {
    await fs.copy(serverEnvExample, serverEnvFile)
  }

  const webEnvExample = path.join(targetDir, 'apps/web/.env.example')
  const webEnvFile = path.join(targetDir, 'apps/web/.env')
  if (
    (await fs.pathExists(webEnvExample)) &&
    !(await fs.pathExists(webEnvFile))
  ) {
    await fs.copy(webEnvExample, webEnvFile)
  }
}

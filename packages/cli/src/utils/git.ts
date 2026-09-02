import { execSync } from 'child_process'
import type { PackageManager } from './pm'

export function initGit(targetDir: string): boolean {
  try {
    execSync('git init', { cwd: targetDir, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export function setupHusky(targetDir: string, pm: PackageManager): boolean {
  try {
    if (pm === 'bun') {
      execSync('bun run prepare', { cwd: targetDir, stdio: 'ignore' })
    } else if (pm === 'pnpm') {
      execSync('pnpm run prepare', { cwd: targetDir, stdio: 'ignore' })
    } else {
      execSync('npm run prepare', { cwd: targetDir, stdio: 'ignore' })
    }
    return true
  } catch {
    return false
  }
}

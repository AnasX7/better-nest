export type PackageManager = 'bun' | 'pnpm' | 'npm'

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || ''
  if (userAgent.startsWith('bun')) return 'bun'
  if (userAgent.startsWith('pnpm')) return 'pnpm'
  if (userAgent.startsWith('npm')) return 'npm'
  return 'bun'
}

export function getInstallCommand(pm: PackageManager): string {
  return `${pm} install`
}

export function getRunCommand(pm: PackageManager, script: string): string {
  if (pm === 'npm') return `npm run ${script}`
  return `${pm} ${script}`
}

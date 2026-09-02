import type { PackageManager } from '../utils/pm'
import type { TemplateType } from '../utils/template'

export type Architecture = 'monorepo' | 'standalone'
export type Frontend = 'next' | 'tanstack-start' | 'tanstack-router' | 'none'
export type Database = 'postgres' | 'sqlite' | 'none'
export type AuthProvider = 'better-auth' | 'none'

export interface AddonContext {
  projectName: string
  targetDir: string
  template: TemplateType
  arch: Architecture
  pm: PackageManager
  db: Database
  frontend: Frontend
  auth: AuthProvider
  git: boolean
  selectedAddons: string[]
}

export interface Addon {
  id: string
  label: string
  hint: string
  default: boolean
  setup(ctx: AddonContext): Promise<void>
}

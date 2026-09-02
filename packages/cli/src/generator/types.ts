import type { PackageManager } from '../utils/pm'

export type Architecture = 'monorepo' | 'standalone'
export type Frontend = 'next' | 'tanstack-start' | 'tanstack-router' | 'none'
export type HttpAdapter = 'fastify' | 'express'
export type Database = 'postgres' | 'sqlite' | 'none'
export type Orm = 'drizzle' | 'none'
export type AuthProvider = 'better-auth' | 'none'
export type ApiDocs = 'scalar' | 'swagger' | 'none'

export interface ProjectConfig {
  projectName: string
  targetDir: string
  pm: PackageManager
  arch: Architecture
  frontend: Frontend
  http: HttpAdapter
  db: Database
  orm: Orm
  auth: AuthProvider
  docs: ApiDocs
  git: boolean
  addons: string[]
}

export interface Recipe {
  id: string
  name: string
  apply(config: ProjectConfig): Promise<void>
}

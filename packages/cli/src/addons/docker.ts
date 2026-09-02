import path from 'path'
import fs from 'fs-extra'
import type { Addon, AddonContext } from './types'

export const dockerAddon: Addon = {
  id: 'docker',
  label: 'Docker & Docker Compose',
  hint: 'Production multi-stage Dockerfile and Postgres container',
  default: true,
  async setup(ctx: AddonContext) {
    const isEnabled = ctx.selectedAddons.includes('docker')

    if (!isEnabled) {
      // Remove docker files in root
      const rootFiles = [
        path.join(ctx.targetDir, 'Dockerfile'),
        path.join(ctx.targetDir, 'docker-compose.yml'),
        path.join(ctx.targetDir, '.dockerignore'),
      ]
      for (const file of rootFiles) {
        if (await fs.pathExists(file)) {
          await fs.remove(file)
        }
      }

      // If monorepo, remove in apps
      const appFiles = [
        path.join(ctx.targetDir, 'apps/server/Dockerfile'),
        path.join(ctx.targetDir, 'apps/server/docker-compose.yml'),
        path.join(ctx.targetDir, 'apps/server/.dockerignore'),
        path.join(ctx.targetDir, 'apps/web/Dockerfile'),
        path.join(ctx.targetDir, 'apps/web/.dockerignore'),
      ]
      for (const file of appFiles) {
        if (await fs.pathExists(file)) {
          await fs.remove(file)
        }
      }
    }
  },
}

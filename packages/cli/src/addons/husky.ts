import path from 'path'
import fs from 'fs-extra'
import type { Addon, AddonContext } from './types'

export const huskyAddon: Addon = {
  id: 'husky',
  label: 'Husky & lint-staged',
  hint: 'Git pre-commit hooks for automated Oxlint & Oxfmt checks',
  default: true,
  async setup(ctx: AddonContext) {
    const isEnabled = ctx.selectedAddons.includes('husky') && ctx.git
    const huskyDir = path.join(ctx.targetDir, '.husky')
    const rootPkgPath = path.join(ctx.targetDir, 'package.json')

    if (!isEnabled) {
      // Remove .husky directory
      if (await fs.pathExists(huskyDir)) {
        await fs.remove(huskyDir)
      }

      // Clean up package.json
      if (await fs.pathExists(rootPkgPath)) {
        const pkg = await fs.readJson(rootPkgPath)
        if (pkg.scripts && pkg.scripts.prepare) {
          delete pkg.scripts.prepare
        }
        if (pkg.devDependencies) {
          delete pkg.devDependencies.husky
          delete pkg.devDependencies['lint-staged']
        }
        delete pkg['lint-staged']
        await fs.writeJson(rootPkgPath, pkg, { spaces: 2 })
      }
      return
    }

    // Ensure pre-commit hook exists and is executable
    await fs.ensureDir(huskyDir)
    const preCommitPath = path.join(huskyDir, 'pre-commit')
    await fs.writeFile(preCommitPath, 'lint-staged\n', { mode: 0o755 })

    // Ensure package.json has prepare and lint-staged
    if (await fs.pathExists(rootPkgPath)) {
      const pkg = await fs.readJson(rootPkgPath)
      pkg.scripts = pkg.scripts || {}
      pkg.scripts.prepare = 'husky'

      pkg['lint-staged'] = pkg['lint-staged'] || {
        '*': [
          'oxlint --no-error-on-unmatched-pattern',
          'oxfmt --write --no-error-on-unmatched-pattern',
        ],
      }
      await fs.writeJson(rootPkgPath, pkg, { spaces: 2 })
    }
  },
}

import { httpRecipe } from './recipes/http'
import { databaseRecipe } from './recipes/database'
import { authRecipe } from './recipes/auth'
import { docsRecipe } from './recipes/docs'
import { frontendRecipe } from './recipes/frontend'
import { runAddonEngine } from '../addons/index'
import { copyTemplate } from '../utils/template'
import type { ProjectConfig, Recipe } from './types'

export const recipes: Recipe[] = [
  httpRecipe,
  databaseRecipe,
  authRecipe,
  docsRecipe,
  frontendRecipe,
]

export async function executeGenerator(config: ProjectConfig): Promise<void> {
  // 1. Copy base template
  const baseTemplate = config.arch === 'monorepo' ? 'fullstack-monorepo' : 'api'

  await copyTemplate({
    projectName: config.projectName,
    targetDir: config.targetDir,
    template: baseTemplate,
    pm: config.pm,
  })

  // 2. Apply all recipes in sequence
  for (const recipe of recipes) {
    await recipe.apply(config)
  }

  // 3. Apply addons engine
  await runAddonEngine({
    projectName: config.projectName,
    targetDir: config.targetDir,
    template: baseTemplate,
    pm: config.pm,
    git: config.git,
    selectedAddons: config.addons,
  })
}

export * from './types'

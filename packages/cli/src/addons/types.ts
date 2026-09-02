import type { PackageManager } from '../utils/pm'
import type { TemplateType } from '../utils/template'

export interface AddonContext {
  projectName: string
  targetDir: string
  template: TemplateType
  pm: PackageManager
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

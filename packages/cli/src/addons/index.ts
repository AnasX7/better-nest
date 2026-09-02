import { huskyAddon } from './husky'
import { dockerAddon } from './docker'
import { mcpAddon } from './mcp'
import type { Addon, AddonContext } from './types'

export const availableAddons: Addon[] = [huskyAddon, dockerAddon, mcpAddon]

export function getAddonOptions() {
  return availableAddons.map((addon) => ({
    value: addon.id,
    label: addon.label,
    hint: addon.hint,
  }))
}

export function getDefaultAddonIds(): string[] {
  return availableAddons
    .filter((addon) => addon.default)
    .map((addon) => addon.id)
}

export async function runAddonEngine(ctx: AddonContext): Promise<void> {
  for (const addon of availableAddons) {
    await addon.setup(ctx)
  }
}

export * from './types'

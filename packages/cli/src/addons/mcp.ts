import path from 'path'
import fs from 'fs-extra'
import type { Addon, AddonContext } from './types'

export const mcpAddon: Addon = {
  id: 'mcp',
  label: 'AI Agent & MCP Config',
  hint: 'Model Context Protocol configuration for Claude Code, Antigravity, and Cursor',
  default: true,
  async setup(ctx: AddonContext) {
    const isEnabled = ctx.selectedAddons.includes('mcp')
    const mcpConfigPath = path.join(ctx.targetDir, '.mcp.json')

    if (!isEnabled) {
      if (await fs.pathExists(mcpConfigPath)) {
        await fs.remove(mcpConfigPath)
      }
      return
    }

    const mcpConfig = {
      $schema: 'https://modelcontextprotocol.io/schema.json',
      mcpServers: {
        scripts: {
          command:
            ctx.pm === 'bun' ? 'bun' : ctx.pm === 'pnpm' ? 'pnpm' : 'npm',
          args: ['run'],
          env: {},
        },
      },
    }

    await fs.writeJson(mcpConfigPath, mcpConfig, { spaces: 2 })
  },
}

const path = require('path')
const fs = require('fs')
const nodeExternals = require('webpack-node-externals')

module.exports = function (options) {
  const builtinHandler = options.externals?.[1]
  const alias = { ...options.resolve?.alias }

  const candidates = [
    ['@repo/auth', '../../packages/auth/src/index.ts'],
    ['@repo/db/schema', '../../packages/db/src/schema/index.ts'],
    ['@repo/db', '../../packages/db/src/index.ts'],
    ['@repo/contracts', '../../packages/contracts/src/index.ts'],
    ['@repo/env/server', '../../packages/env/src/server.ts'],
    ['@repo/env', '../../packages/env/src/server.ts'],
  ]

  for (const [key, relPath] of candidates) {
    const fullPath = path.resolve(__dirname, relPath)
    if (fs.existsSync(fullPath)) {
      alias[key] = fullPath
    }
  }

  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias,
    },
    externals: [
      nodeExternals({
        importType: 'module',
        allowlist: [/^@repo/],
      }),
      ...(builtinHandler ? [builtinHandler] : []),
    ],
  }
}

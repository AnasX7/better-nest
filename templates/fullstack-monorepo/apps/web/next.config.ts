import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/contracts', '@repo/api', '@repo/env', '@repo/ui'],
  reactCompiler: true,
}

export default nextConfig

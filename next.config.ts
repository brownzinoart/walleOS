import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['three'],
  experimental: {
    typedRoutes: true,
  },
}

export default config

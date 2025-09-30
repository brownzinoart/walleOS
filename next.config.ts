import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['three'],
  experimental: {
    typedRoutes: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '',
  },
}

export default config

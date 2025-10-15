import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, 'src')
      },
      {
        find: /^gsap\/CustomEase$/,
        replacement: resolve(__dirname, 'node_modules/gsap/CustomEase.js')
      },
      {
        find: /^gsap$/,
        replacement: resolve(__dirname, 'node_modules/gsap/index.js')
      }
    ]
  },
  server: {
    host: true,
    port: 3000,
    open: true
  },
  preview: {
    host: true,
    port: 3000
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          return undefined;
        }
      }
    }
  },
  css: {
    postcss: resolve(__dirname, 'postcss.config.js')
  }
});

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
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
        }
      }
    }
  },
  css: {
    postcss: resolve(__dirname, 'postcss.config.js')
  }
});

import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@",
        replacement: resolve(__dirname, "src"),
      },
    ],
  },
  server: {
    host: true,
    port: 3000,
    open: true,
  },
  preview: {
    host: true,
    port: 3000,
  },
  build: {
    target: "es2020",
    minify: "terser",
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ["gsap"],
          locomotive: ["locomotive-scroll"],
          vendor: [
            // Add other vendor libraries here as needed
          ],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
    },
  },
  css: {
    postcss: resolve(__dirname, "postcss.config.js"),
  },
});
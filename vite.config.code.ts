import path from 'path'
import { defineConfig } from 'vite'

// Build config for code.js - runs in Figma's sandbox (no DOM, no modules)
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2017',
    sourcemap: mode !== 'production' ? 'inline' : false,
    minify: mode === 'production' ? 'esbuild' : false,
    lib: {
      entry: path.resolve(__dirname, 'src/code.ts'),
      formats: ['iife'],
      name: 'code',
      fileName: () => 'code.js'
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
}))

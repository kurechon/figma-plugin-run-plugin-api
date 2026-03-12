import path from 'path'
import react from '@vitejs/plugin-react'
import { type Plugin, defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import svgr from 'vite-plugin-svgr'

// Figma plugin requires two separate builds:
// 1. code.js - runs in Figma's sandbox (no DOM)
// 2. ui.html - all JS/CSS inlined into a single HTML file

function renameHtml(): Plugin {
  return {
    name: 'rename-index-to-ui',
    enforce: 'post',
    generateBundle(_, bundle) {
      const htmlKey = Object.keys(bundle).find(k => k.endsWith('.html'))
      if (htmlKey && bundle[htmlKey]) {
        bundle[htmlKey].fileName = 'ui.html'
      }
    }
  }
}

export default defineConfig(({ mode }) => ({
  root: path.resolve(__dirname, 'src/ui'),
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    svgr({
      include: '**/*.inline.svg'
    }),
    viteSingleFile(),
    renameHtml()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: mode !== 'production' ? 'inline' : false,
    minify: mode === 'production' ? 'esbuild' : false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      },
      external: ['ts']
    }
  }
}))

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { execSync } from 'child_process'
import * as url from 'url'
import path from 'path'
import packageJson from './package.json'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const commitHash = execSync('git rev-parse HEAD').toString()

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const defines = {
  BUILD_META: JSON.stringify({
    version: packageJson.version,
    commit: commitHash,
    buildDate: new Date().toLocaleString(),
    env: env,
  }),
}

const distFolder = path.join(__dirname, '..', 'valoreye', 'dist', 'static')

// https://vitejs.dev/config/
export default defineConfig({
  define: defines,
  plugins: [react()],
  mode: env,
  build: {
    outDir: distFolder,
    emptyOutDir: true,
    target: ['es2020'],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: ['es2020'],
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})

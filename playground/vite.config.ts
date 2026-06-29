import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { VeltraDesktopUIResolver } from '@veltra/vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite-plus'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const nodePkgImporter = new NodePackageImporter(repoRoot)

const config = {
  base: '/',

  css: { preprocessorOptions: { scss: { importers: [nodePkgImporter] } } },

  resolve: { extensions: ['.ts', '.js', '.json', '.tsx'], conditions: ['veltra-dev'] },

  plugins: [vue(), vueJsx(), Components({ resolvers: [VeltraDesktopUIResolver()], dts: true })],

  server: { port: 7788, host: true }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite-plus'

// vp run 加载配置时用 Node 解析模块，不走 veltra-dev；@veltra/vite 的 import 指向 dist，dist 缺失时 vp run 会在构建前失败
import { VeltraUIResolver } from '../packages/vite/src/resolver'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const nodePkgImporter = new NodePackageImporter(repoRoot)

const config = {
  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'node' },

  base: '/',

  css: { preprocessorOptions: { scss: { importers: [nodePkgImporter] } } },

  resolve: { extensions: ['.ts', '.js', '.json', '.tsx'], conditions: ['veltra-dev'] },

  plugins: [vue(), vueJsx(), Components({ resolvers: [VeltraUIResolver()], dts: true })],

  server: { port: 7788, host: true }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])

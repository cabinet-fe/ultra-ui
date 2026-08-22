import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { NodePackageImporter } from 'sass-embedded'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite-plus'

// vp run 加载配置时用 Node 解析模块，不走 veltra-dev；@veltra/vite 的 import 指向 dist，dist 缺失时 vp run 会在构建前失败
import { VeltraUIResolver } from '../packages/vite/src/resolver'
// 参考服务（report + DeepSeek，同一端口）：前端经 /report-api、/ai 代理访问
import { REPORT_SERVER_PORT } from './server/port'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const hucreRoot = resolve(repoRoot, 'packages/sheet-core/node_modules/hucre')
const nodePkgImporter = new NodePackageImporter(repoRoot)

const config = {
  test: { include: ['src/**/*.test.ts'], globals: true, environment: 'node' },

  base: '/',

  css: { preprocessorOptions: { scss: { importers: [nodePkgImporter] } } },

  resolve: {
    extensions: ['.ts', '.js', '.json', '.tsx'],
    conditions: ['veltra-dev'],
    alias: {
      'hucre/xlsx': resolve(hucreRoot, 'dist/xlsx.mjs'),
      'hucre/csv': resolve(hucreRoot, 'dist/csv.mjs')
    }
  },

  plugins: [vue(), vueJsx(), Components({ resolvers: [VeltraUIResolver()], dts: true })],

  server: {
    port: 7788,
    host: true,
    proxy: {
      // 前端 createHttpConnector({ endpoint: '/report-api' }) → 契约参考服务（去前缀转发）
      '/report-api': {
        target: `http://localhost:${REPORT_SERVER_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/report-api/, '')
      },
      // AI 会话代理：只匹配 /ai 与 /ai/*，避免把 /ai-chat SPA 路由也代理走。
      // Vite 字符串上下文是前缀匹配，必须用正则锁定边界。
      '^/ai(?:/|$)': { target: `http://localhost:${REPORT_SERVER_PORT}`, changeOrigin: true }
    }
  }
}

export default defineConfig(config as Parameters<typeof defineConfig>[0])

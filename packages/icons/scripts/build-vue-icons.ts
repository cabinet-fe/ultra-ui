import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build as tsdownBuild } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')
const distRoot = join(PKG_ROOT, 'dist')

await tsdownBuild({
  cwd: PKG_ROOT,
  tsconfig: join(PKG_ROOT, 'tsconfig.icons-vue.json'),
  entry: ['src/index.ts', 'src/normal.ts', 'src/colorful.ts'].map((f) => join(PKG_ROOT, f)),
  unbundle: true,
  platform: 'browser',
  plugins: [Vue({ isProduction: true })],
  format: ['es'],
  sourcemap: true,
  dts: { vue: true },
  clean: true,
  outDir: distRoot
})

console.log('icons 构建完成（tsdown unbundle + dts.vue）；具名导出入口: index + normal + colorful')

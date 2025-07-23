import { build } from 'tsdown'
import fg from 'fast-glob'
// import Vue from 'unplugin-vue/rolldown'
import { UI_ROOT } from './helper'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'

async function b() {
  // const input = await fg.glob('**/*.{ts,vue,tsx}', {
  //   cwd
  // }
  await build({
    entry: ['components/*/index.ts', '{compositions,utils,shared}/**/*.ts'],
    cwd: UI_ROOT,
    plugins: [
      Vue({
        isProduction: true
      }),
      VueJsx()
    ],
    format: 'es',
    dts: true,
    silent: true,
    platform: 'browser',
    // sourcemap: true,
    external: ['vue'],
    minify: true,
    outDir: '../dist'
  })
}

b()

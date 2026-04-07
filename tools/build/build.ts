import { build as tsdownBuild } from 'tsdown'
import { DIST_ROOT, UI_ROOT, workspaceTsAliases } from './shared'
import Vue from 'unplugin-vue/rolldown'
import VueJSX from 'unplugin-vue-jsx/rolldown'

export async function build() {
  await tsdownBuild({
    cwd: UI_ROOT,
    entry: ['index.ts', 'types/index.ts'],
    alias: { ...workspaceTsAliases },
    unbundle: true,
    platform: 'browser',
    plugins: [
      Vue({
        isProduction: true
      }),
      VueJSX()
    ],
    format: ['es'],
    sourcemap: true,
    dts: {
      vue: true
    },

    outDir: DIST_ROOT
  })
}

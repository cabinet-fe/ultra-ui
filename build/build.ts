import { resolve } from 'node:path'
import { build as tsdownBuild } from 'tsdown'
import Vue from 'unplugin-vue/rolldown'
import VueJSX from 'unplugin-vue-jsx/rolldown'
import {
  buildDirectiveStyleEntries,
  buildPcStyleEntries,
  buildStylesPackage,
  scssPlugin
} from './build-styles'
import {
  CORE_ROOT,
  DIRECTIVES_ROOT,
  PC_ROOT,
  PC_SRC,
  workspaceAliases
} from './shared'

const coreDist = resolve(CORE_ROOT, 'dist')
const directivesDist = resolve(DIRECTIVES_ROOT, 'dist')
const pcDist = resolve(PC_ROOT, 'dist')

const ultraExternal = [/^@ultra-ui\//]

export async function buildCore() {
  await tsdownBuild({
    cwd: CORE_ROOT,
    entry: ['src/index.ts'],
    outDir: coreDist,
    unbundle: true,
    platform: 'browser',
    format: ['es'],
    sourcemap: true,
    dts: true,
    clean: true
  })
}

export async function buildDirectivesPackage() {
  await tsdownBuild({
    cwd: DIRECTIVES_ROOT,
    entry: ['src/index.ts'],
    outDir: directivesDist,
    alias: { ...workspaceAliases },
    unbundle: true,
    platform: 'browser',
    format: ['es'],
    sourcemap: true,
    dts: true,
    clean: true,
    external: ultraExternal
  })
  await buildDirectiveStyleEntries()
}

export async function buildPcPackage() {
  await tsdownBuild({
    cwd: PC_ROOT,
    entry: ['src/index.ts', 'src/types/index.ts'],
    outDir: pcDist,
    alias: { ...workspaceAliases },
    unbundle: true,
    platform: 'browser',
    plugins: [
      scssPlugin(pcDist, true),
      Vue({ isProduction: true }),
      VueJSX()
    ],
    format: ['es'],
    sourcemap: true,
    dts: {
      vue: true
    },
    external: ultraExternal,
    clean: true
  })
  await buildPcStyleEntries()
}

export async function build() {
  await buildCore()
  await buildStylesPackage()
  await buildDirectivesPackage()
  await buildPcPackage()
}

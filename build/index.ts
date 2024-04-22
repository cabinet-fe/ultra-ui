import { build } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { genPackageJson } from './gen-package-json'
import { copyTypes } from './copy-types'
import { copyStyles } from './copy-styles'

const __dirname = dirname(fileURLToPath(import.meta.url))

const UI_ROOT = resolve(__dirname, '../ui')

function getEntries(fileNames: string[]) {
  return fileNames.map(fileName => {
    return resolve(UI_ROOT, fileName)
  })
}

async function bundle() {
  await build({
    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx']
    },

    plugins: [
      vue(),
      vueJsx(),
      dts({
        tsconfigPath: resolve(__dirname, 'tsconfig.build.json'),
        include: ['../ui-packages/**/*', '../ui/**/*'],
        exclude: ['node_modules']
      })
    ],

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: true,

      lib: {
        entry: getEntries(['components.ts']),
        formats: ['es']
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', 'icon-ultra', 'cat-kit/fe'],

        output: {
          preserveModules: true
        }
      }
    }
  })
}

async function boot() {
  await bundle()

  genPackageJson()

  await copyTypes()

  await copyStyles()
}

boot()

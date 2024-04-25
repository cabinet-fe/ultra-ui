import { build } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { genPackageJson } from './gen-package-json'
import { copyStyles } from './copy-styles'
import { cp } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

const UI_ROOT = resolve(__dirname, '../ui')

function getEntries(fileNames: string[]) {
  return fileNames.map(fileName => {
    return resolve(UI_ROOT, fileName + '.ts')
  })
}

async function bundle() {
  await build({
    resolve: {
      extensions: ['.ts', '.js', '.json', '.tsx'],
      alias: [{ find: '@ui', replacement: resolve(__dirname, '../ui') }]
    },

    plugins: [
      vue({
        isProduction: true
      }),
      vueJsx(),
      dts({
        entryRoot: UI_ROOT,

        tsconfigPath: resolve(__dirname, '../ui/tsconfig.json'),
        include: ['../ui/**/*'],
        exclude: ['node_modules']
      })
    ],

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: true,

      lib: {
        entry: getEntries([
          'index',
          'components/index',
          'directives/index',
          'utils/index',
          'compositions/index',
          'styles/index'
        ]),
        formats: ['es']
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', 'icon-ultra', 'cat-kit/fe'],

        output: {
          preserveModules: true
        }
      }
    },

    logLevel: 'warn'
  })
}

async function boot() {
  await bundle()

  genPackageJson()

  cp(
    resolve(__dirname, '../README.md'),
    resolve(__dirname, '../dist/README.md')
  )

  copyStyles()
}

boot()

import { build } from 'vite'
import dts from 'vite-plugin-dts'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildStyles } from './build-styles'
import fg from 'fast-glob'
import { copyFiles } from './copy'

const __dirname = dirname(fileURLToPath(import.meta.url))

const UI_ROOT = resolve(__dirname, '../ui')

async function getEntries() {
  const entries = await fg.glob('**/*.{ts,vue,tsx}', {
    cwd: UI_ROOT,
    ignore: ['**/node_modules', '**/__test__', 'types/**', '**/style.ts']
  })
  return Object.fromEntries(
    entries.map(entry => [
      entry.slice(0, -extname(entry).length),
      resolve(UI_ROOT, entry)
    ])
  )
}

async function bundle() {
  const entries = await getEntries()

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
        tsconfigPath: resolve(__dirname, '../ui/tsconfig.json'),
        include: ['../ui/**/*'],
        exclude: ['node_modules'],
        outDir: resolve(__dirname, '../dist')
      })
    ],

    logLevel: 'warn',

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: true,

      lib: {
        entry: entries,
        formats: ['es']
      },

      rollupOptions: {
        // 确保外部化处理那些你不想打包进库的依赖
        external: ['vue', 'icon-ultra', 'cat-kit/fe'],
        output: {
          chunkFileNames: 'venders/[name]-[hash].js'
        }
      }
    }
  })
}

async function boot() {
  await bundle()

  buildStyles()

  copyFiles()
}

boot()

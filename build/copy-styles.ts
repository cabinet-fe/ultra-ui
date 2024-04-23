import { cp } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import dts from 'vite-plugin-dts'
import { readDir } from 'cat-kit/be'

const __dirname = dirname(fileURLToPath(import.meta.url))

const excludeFiles = new Set(['index.ts'])

async function getEntries() {
  const dirs = await readDir(resolve(__dirname, '../ui/components'), {
    readType: 'dir'
  })

  return dirs.map(dir => {
    return dir.path + '/style.ts'
  })
}

async function bundle() {
  const entry = await getEntries()

  await build({
    resolve: {
      extensions: ['.ts', '.js'],
      alias: [{ find: '@ui', replacement: resolve(__dirname, '../ui') }]
    },

    plugins: [
      dts({
        tsconfigPath: resolve(__dirname, '../ui/tsconfig.json'),
        include: ['../ui/**/*'],
        exclude: ['node_modules']
      })
    ],

    build: {
      sourcemap: true,

      outDir: resolve(__dirname, '../dist'),

      emptyOutDir: false,

      lib: {
        entry,
        formats: ['es'],
        fileName: 'ss/[name]'
      }
    }
  })
}

/**
 * 拷贝@ui/types文件夹
 */
export async function copyStyles() {
  /** 拷贝公用样式 */
  cp(resolve(__dirname, '../ui/styles'), resolve(__dirname, '../dist/styles'), {
    recursive: true,
    filter: src => {
      return excludeFiles.has(basename(src)) ? false : true
    }
  })

  /** 拷贝组件样式 */
  // cp(resolve(__dirname, '../ui/components/'))

  await bundle()
}

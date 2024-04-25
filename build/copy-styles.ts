import { cp } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'
import fg from 'fast-glob'
import { rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))

const excludeFiles = new Set(['index.ts'])

const UI_ROOT = resolve(__dirname, '../ui')

async function getEntries() {
  const entries = await fg.glob(
    ['components/**/style.ts', 'directives/**/style.ts'],
    {
      ignore: ['**/node_modules'],
      cwd: UI_ROOT
    }
  )

  // 生成如下格式
  /**
   * {
   *   'components/button/style': resolve(__dirname, '../ui/components/button/style.ts'),
   *    ...
   * }
   */
  return Object.fromEntries(
    entries.map(entry => [
      entry.slice(0, -extname(entry).length),
      resolve(UI_ROOT, entry)
    ])
  )
}

async function getScssEntries() {
  const entries = await fg.glob(
    ['components/**/*.scss', 'directives/**/*.scss'],
    {
      ignore: ['**/node_modules'],
      cwd: UI_ROOT
    }
  )

  return entries
}

async function build() {
  const entry = await getEntries()

  const bundle = await rollup({
    input: entry,

    // 排除scss文件直接复制到打包后的目录即可
    external(source) {
      if (source.endsWith('.scss') && !source.startsWith('@ui')) {
        return true
      }
      return false
    },

    plugins: [
      esbuild({
        minify: false
      }),
      {
        name: 'alias',
        resolveId: {
          order: 'pre',
          handler(id, importer) {
            if (!id.startsWith('@ui')) return
            if (importer) {
              id = relative(dirname(importer), id.replace('@ui', UI_ROOT))
            } else {
              id.replaceAll('@ui', 'ultra-ui')
            }
            return {
              id,
              external: 'relative'
            }
          }
        }
      },

      dts({
        tsconfigPath: resolve(__dirname, '../ui/tsconfig.json'),
        include: ['../ui/**/*'],
        exclude: ['node_modules']
      })
    ]
  })

  bundle.write({
    dir: resolve(__dirname, '../dist'),
    format: 'es'
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
  const scssEntries = await getScssEntries()
  scssEntries.forEach(entry => {
    cp(resolve(UI_ROOT, entry), resolve(__dirname, '../dist', entry))
  })

  await build()
}

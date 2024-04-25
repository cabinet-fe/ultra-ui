import { cp, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'
import fg from 'fast-glob'
import { rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import { compile } from 'sass'

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

async function buildStyleEntry() {
  const entry = await getEntries()

  const bundle = await rollup({
    input: entry,

    // 排除scss文件直接复制到打包后的目录即可
    external(source) {
      if (source.endsWith('.css')) return true
      return false
    },

    logLevel: 'warn',

    plugins: [
      esbuild({
        minify: false
      }),
      {
        name: 'alias',
        resolveId: {
          order: 'pre',
          handler(id, importer) {
            if (id.startsWith('@ui')) {
              if (importer) {
                id = relative(dirname(importer), id.replace('@ui', UI_ROOT))
              } else {
                id.replaceAll('@ui', 'ultra-ui')
              }
              return {
                id,
                external: 'absolute'
              }
            }

            if (id.endsWith('.scss')) {
              id = id.replace(/\.scss$/, '.css')

              return {
                id,
                external: 'absolute'
              }
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

async function buildCSS() {
  const entries = await getScssEntries()

  const results = await Promise.all(
    entries.map(async entry => {
      const result = compile(resolve(UI_ROOT, entry))
      return {
        path: resolve(__dirname, '../dist', entry).slice(0, -5) + '.css',
        css: result.css
      }
    })
  )

  results.forEach(result => {
    console.log(result.path)
    writeFile(result.path, result.css)
  })
}

/**
 * 构建样式
 */
export async function buildStyles() {
  /** 拷贝公用样式 */
  cp(resolve(__dirname, '../ui/styles'), resolve(__dirname, '../dist/styles'), {
    recursive: true,
    filter: src => {
      return excludeFiles.has(basename(src)) ? false : true
    }
  })

  /** 拷贝组件样式 */
  await buildStyleEntry()

  /** 构建组件样式 */
  await buildCSS()
}
buildStyles()

import { cp, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import { rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import { compileAsync } from 'sass'
import { statSync } from 'node:fs'

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
    ['components/**/*.scss', 'directives/**/*.scss', 'styles/**/*.scss'],
    {
      ignore: ['**/node_modules', '**/_*.scss'],
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
        minify: false,
        format: 'esm'
      }),
      {
        name: 'alias',
        resolveId: {
          order: 'pre',
          handler(source, importer) {
            // 如果导入来源是scss文件，则将导入来源替换为css文件
            if (source.endsWith('.scss')) {
              source = source.replace(/\.scss$/, '.css')
            }

            // 如果导入来源以@ui开头，则将导入来源替换为相对于导入文件的相对路径
            if (source.startsWith('@ui') && importer) {
              source = relative(
                dirname(importer),
                source.replace('@ui', UI_ROOT)
              ).replace(/\\/g, '/')
            }

            if (source.endsWith('style')) {
              source = source + '.js'
            }

            // 表示入口文件
            if (!importer) {
              return source
            }

            // 标记为外部文件，不进行额外地构建
            return {
              id: source,
              external: true
            }
          }
        }
      }
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
      const result = await compileAsync(resolve(UI_ROOT, entry))
      return {
        path: resolve(__dirname, '../dist', entry).slice(0, -5) + '.css',
        css: result.css
      }
    })
  )

  results.forEach(result => {
    writeFile(result.path, result.css)
  })
}

/**
 * 构建样式
 */
export async function buildStyles() {
  /** 拷贝公用样式 */
  await cp(
    resolve(__dirname, '../ui/styles'),
    resolve(__dirname, '../dist/styles'),
    {
      recursive: true,
      filter: src => {
        if (statSync(src).isDirectory()) return true
        const filename = basename(src)

        if (
          (/^_.*\.scss$/.test(filename) || /\.woff2$/.test(filename)) &&
          !excludeFiles.has(filename)
        ) {
          return true
        }

        return false
      }
    }
  )

  /** 构建组件样式 */
  await buildCSS()

  /** 构建组件入口 */
  await buildStyleEntry()
}

import { cp } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { statSync } from 'node:fs'
import { compileAsync } from 'sass-embedded'
import { DIST_ROOT, UI_ROOT } from './shared'
import { build as tsdownBuild } from 'tsdown'
import type { Plugin } from 'rolldown'

// 存储已编译的 SCSS 文件信息
const compiledScssMap = new Map<string, { css: string; outputPath: string }>()

/**
 * 解析导入路径，支持 @ui 别名
 */
function resolveImportPath(source: string, importer: string): string {
  // 处理 @ui 别名
  if (source.startsWith('@ui/')) {
    return resolve(UI_ROOT, source.slice(4)) // 移除 '@ui/' 前缀
  }
  // 相对路径
  return resolve(dirname(importer), source)
}

/**
 * SCSS 插件
 *
 * - 将 .scss 导入编译为 CSS 并输出
 * - 在 JS 中重写导入路径为 .css
 * - 将 .css 和 style.js 导入标记为外部模块
 */
function scssPlugin(): Plugin {
  return {
    name: 'scss',

    /**
     * 解析模块导入
     */
    resolveId: {
      filter: { id: /\.(scss|css|js)$|\/style$/ },
      async handler(source, importer) {
        if (!importer) return null

        // 处理 .css 导入 - 标记为外部模块
        if (source.endsWith('.css')) {
          return {
            id: source,
            external: true
          }
        }

        // 处理 .js 导入 - 标记为外部模块
        if (source.endsWith('.js')) {
          return {
            id: source,
            external: true
          }
        }

        // 处理无扩展名的 style 导入 - 标记为外部模块并重写为 .js
        if (source.endsWith('/style')) {
          return {
            id: source + '.js',
            external: true
          }
        }

        // 处理 .scss 导入
        if (source.endsWith('.scss')) {
          const resolved = resolveImportPath(source, importer)

          // 计算相对于 UI_ROOT 的路径，用于确定输出位置
          const relativeToUI = relative(UI_ROOT, resolved)
          const cssOutputPath = resolve(
            DIST_ROOT,
            relativeToUI.replace(/\.scss$/, '.css')
          )

          // 编译 SCSS 文件
          try {
            const result = await compileAsync(resolved, {
              loadPaths: [UI_ROOT, dirname(resolved)]
            })

            compiledScssMap.set(resolved, {
              css: result.css,
              outputPath: cssOutputPath
            })
          } catch (error) {
            console.error(`Failed to compile SCSS: ${resolved}`, error)
            throw error
          }

          // 返回一个虚拟 ID，表示这是需要处理的 SCSS
          return {
            id: `\0scss:${resolved}`,
            external: false
          }
        }

        return null
      }
    },

    /**
     * 加载虚拟的 SCSS 模块
     * 返回空模块，因为实际的 CSS 会单独输出
     */
    load: {
      filter: { id: /^\0scss:/ },
      handler() {
        // 返回空模块，CSS 文件会单独输出
        return {
          code: '',
          map: null
        }
      }
    },

    /**
     * 转换 style.ts 文件
     * 将导入路径重写为正确的格式
     */
    transform: {
      filter: { id: /style\.ts$/ },
      handler(code, id) {
        let transformed = code

        // 1. 将 import '@ui/styles/xxx.scss' 重写为相对路径 CSS 导入
        //    计算从当前文件到 styles 目录的相对路径
        const currentDir = dirname(relative(UI_ROOT, id))
        const relativeToStyles = relative(currentDir, 'styles')

        transformed = transformed.replace(
          /import\s+['"]@ui\/styles\/([^'"]+)\.scss['"]/g,
          (_, path) => `import '${relativeToStyles}/${path}.css'`
        )

        // 2. 将 import './style.scss' 重写为 import './style.css'
        transformed = transformed.replace(
          /import\s+['"]([^'"]+)\.scss['"]/g,
          "import '$1.css'"
        )

        // 3. 将 import '../xxx/style' 重写为 import '../xxx/style.js'
        //    匹配不带扩展名的 style 导入
        transformed = transformed.replace(
          /import\s+['"]([^'"]+\/style)['"]/g,
          "import '$1.js'"
        )

        return {
          code: transformed,
          map: null
        }
      }
    },

    /**
     * 在生成阶段输出编译后的 CSS 文件
     */
    async generateBundle() {
      for (const [_scssPath, { css, outputPath }] of compiledScssMap) {
        // 计算相对于 DIST_ROOT 的文件名
        const fileName = relative(DIST_ROOT, outputPath)

        this.emitFile({
          type: 'asset',
          fileName,
          source: css
        })
      }

      // 清理缓存
      compiledScssMap.clear()
    }
  }
}

export async function buildStyles() {
  await tsdownBuild({
    cwd: UI_ROOT,
    alias: { '@ui': UI_ROOT },
    logLevel: 'warn',
    entry: [
      'components/**/style.ts',
      'directives/**/style.ts',
      'styles/index.ts'
    ],
    plugins: [scssPlugin()],
    unbundle: true,
    clean: false,
    platform: 'browser',
    format: ['es'],
    dts: true,
    outDir: DIST_ROOT
  })
}

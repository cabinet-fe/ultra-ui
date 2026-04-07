import { dirname, relative, resolve } from 'node:path'
import { compileAsync } from 'sass-embedded'
import { DIST_ROOT, UI_ROOT } from './shared'
import { build as tsdownBuild } from 'tsdown'
import type { Plugin } from 'rolldown'

// 存储已编译的 SCSS 文件信息
const compiledScssMap = new Map<string, { css: string; outputPath: string }>()

/**
 * SCSS 优化插件
 *
 * 利用 resolveId 钩子拦截样式相关导入：
 * 1. 使用 this.resolve() 解析别名（如 @ui）为真实路径。
 * 2. 编译 SCSS 并将其重写为 .css 的相对路径。
 * 3. 将 style/css/js 导入转换为正确的相对路径并标记为外部。
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

        // 1. 调用内置解析器（支持 alias 配置）
        const resolved = await this.resolve(source, importer, {
          skipSelf: true
        })
        if (!resolved) return null

        const absolutePath = resolved.id

        // 只处理项目内部（UI_ROOT）的模块
        if (!absolutePath.startsWith(UI_ROOT)) return null

        // 2. 处理 SCSS 编译
        if (absolutePath.endsWith('.scss')) {
          const relativeToUI = relative(UI_ROOT, absolutePath)
          const cssOutputPath = resolve(
            DIST_ROOT,
            relativeToUI.replace(/\.scss$/, '.css')
          )

          // 编译 scss（如果地图中不存在）
          if (!compiledScssMap.has(absolutePath)) {
            try {
              const result = await compileAsync(absolutePath, {
                loadPaths: [UI_ROOT, dirname(absolutePath)]
              })
              compiledScssMap.set(absolutePath, {
                css: result.css,
                outputPath: cssOutputPath
              })
            } catch (error) {
              console.error(`Failed to compile SCSS: ${absolutePath}`, error)
              throw error
            }
          }

          // 将导入重写为相对路径的 .css
          let relativePath = relative(
            dirname(importer),
            absolutePath.replace(/\.scss$/, '.css')
          )
          if (!relativePath.startsWith('.')) relativePath = './' + relativePath
          return { id: relativePath, external: true }
        }

        // 3. 处理其他样式相关的 JS/CSS 导入
        // 目标是将 @ui/... 转换为正确的相对路径并确保后缀正确 (.js)
        let targetPath = absolutePath.replace(/\.ts$/, '.js')

        // 如果是无后缀的 style 导入，补齐 .js
        if (source.endsWith('/style') && !targetPath.endsWith('.js')) {
          targetPath += '.js'
        }

        let relativePath = relative(dirname(importer), targetPath)
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath

        return {
          id: relativePath,
          external: true
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

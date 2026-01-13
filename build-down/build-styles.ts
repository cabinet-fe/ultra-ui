import { cp } from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import { statSync } from 'node:fs'
import { compileAsync } from 'sass-embedded'
import { DIST_ROOT, UI_ROOT } from './shared'
import { build as tsdownBuild } from 'tsdown'
import type { RolldownPlugin } from 'rolldown'

/**
 * 样式构建（独立脚本）- Optimized with tsdown & sass-embedded
 */

function toPosixPath(p: string) {
  return p.replace(/\\/g, '/')
}

function isScssPartial(filename: string) {
  return /^_.*\.scss$/i.test(filename)
}

async function copyStylesAssets() {
  // styles 目录中的 fonts / 图片等静态资源，以及 _*.scss partial，保持目录结构拷贝到 dist/styles
  await cp(resolve(UI_ROOT, 'styles'), resolve(DIST_ROOT, 'styles'), {
    recursive: true,
    filter: src => {
      if (statSync(src).isDirectory()) return true
      const name = basename(src)
      // 这里不拷贝会被编译产出的 scss（如 normalize.scss / anime/*.scss）
      if (name.endsWith('.scss') && !isScssPartial(name)) return false
      // 这里也不拷贝 styles 下 the ts（styles/index.ts 会被编译为 dist/styles/index.js）
      if (name.endsWith('.ts')) return false
      return true
    }
  })
}

function scssPlugin(): RolldownPlugin {
  return {
    name: 'scss',
    async resolveId(source: string, importer: string | undefined) {
      // 1) 处理 .scss 文件：编译并重写导入
      if (source.endsWith('.scss')) {
        let absPath: string
        if (source.startsWith('@ui/')) {
          absPath = resolve(UI_ROOT, source.slice(4))
        } else if (source.startsWith('.')) {
          if (!importer) return null
          absPath = resolve(dirname(importer), source)
        } else {
          return null
        }

        try {
          const result = await compileAsync(absPath)
          const relPath = relative(UI_ROOT, absPath)
          const fileName = relPath.replace(/\.scss$/, '.css')

          // 发射 CSS 文件到输出目录
          this.emitFile({
            type: 'asset',
            fileName,
            source: result.css
          })

          // 重写导入路径为 .css 并标记为外部依赖（unbundle 模式保持 import 语句）
          return {
            id: source.replace(/\.scss$/, '.css'),
            external: true
          }
        } catch (e) {
          console.error(`Failed to compile SCSS: ${absPath}`, e)
          return null
        }
      }

      // 2) 处理样式引用：@ui 别名转换及补全 .js 扩展名
      if (importer && (source.startsWith('@ui/') || (!source.match(/\.\w+$/) && (source === './style' || source.endsWith('/style'))))) {
        let targetAbs: string
        if (source.startsWith('@ui/')) {
          targetAbs = resolve(UI_ROOT, source.slice(4))
        } else {
          targetAbs = resolve(dirname(importer), source)
        }

        let rel = toPosixPath(relative(dirname(importer), targetAbs))
        if (!rel.startsWith('.')) rel = `./${rel}`

        // unbundle 模式下，ESM 导入必须包含扩展名
        if (!rel.match(/\.\w+$/)) {
          rel += '.js'
        }

        return {
          id: rel,
          external: true
        }
      }

      return null
    }
  }
}

export async function buildStyles() {
  // 1) 拷贝静态资源（fonts等）和 scss partials
  await copyStylesAssets()

  // 2) 使用 tsdown 构建样式相关入口
  await tsdownBuild({
    cwd: UI_ROOT,
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

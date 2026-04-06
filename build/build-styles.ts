import { dirname, join, relative, resolve } from 'node:path'
import { compileAsync } from 'sass-embedded'
import {
  DIRECTIVES_SRC,
  PC_ROOT,
  PC_SRC,
  ROOT,
  STYLES_ROOT,
  STYLES_SRC,
  DIRECTIVES_ROOT,
  workspaceAliases
} from './shared'
import { build as tsdownBuild } from 'tsdown'
import type { Plugin } from 'rolldown'

const compiledScssMap = new Map<string, { css: string; outputPath: string }>()

function isUiStyleFile(abs: string): boolean {
  return (
    abs.startsWith(PC_SRC + '/') ||
    abs.startsWith(DIRECTIVES_SRC + '/') ||
    abs.startsWith(STYLES_SRC + '/')
  )
}

/** PC 构建时 styles 包内 SCSS 落在 dist 的 `styles/` 子目录；构建 @ultra-ui/styles 本体时不加此前缀 */
function distRelativeForStyle(abs: string, nestStylesFromPackage: boolean): string {
  if (abs.startsWith(PC_SRC + '/')) {
    return relative(PC_SRC, abs)
  }
  if (abs.startsWith(DIRECTIVES_SRC + '/')) {
    return relative(DIRECTIVES_SRC, abs)
  }
  if (abs.startsWith(STYLES_SRC + '/')) {
    const rel = relative(STYLES_SRC, abs)
    return nestStylesFromPackage ? join('styles', rel) : rel
  }
  return relative(PC_SRC, abs)
}

/**
 * @param distRoot 当前 tsdown 产物根目录（绝对路径）
 * @param nestStylesFromPackage 为 true 时，将 `@ultra-ui/styles` 内 SCSS 编译到 `dist/styles/...`（供 PC 消费）
 */
export function scssPlugin(
  distRoot: string,
  nestStylesFromPackage = true
): Plugin {
  return {
    name: 'scss',

    resolveId: {
      filter: { id: /\.(scss|css|js)$|\/style$/ },
      async handler(source, importer) {
        if (!importer) return null

        const resolved = await this.resolve(source, importer, {
          skipSelf: true
        })
        if (!resolved) return null

        const absolutePath = resolved.id

        if (!isUiStyleFile(absolutePath)) return null

        if (absolutePath.endsWith('.scss')) {
          const rel = distRelativeForStyle(absolutePath, nestStylesFromPackage)
          const cssOutputPath = resolve(distRoot, rel.replace(/\.scss$/, '.css'))

          if (!compiledScssMap.has(absolutePath)) {
            try {
              const result = await compileAsync(absolutePath, {
                loadPaths: [STYLES_SRC, dirname(absolutePath)]
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

          let relativePath = relative(
            dirname(importer),
            absolutePath.replace(/\.scss$/, '.css')
          )
          if (!relativePath.startsWith('.')) relativePath = './' + relativePath
          return { id: relativePath, external: true }
        }

        let targetPath = absolutePath.replace(/\.ts$/, '.js')

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

    async generateBundle() {
      for (const [_scssPath, { css, outputPath }] of compiledScssMap) {
        const fileName = relative(distRoot, outputPath)

        this.emitFile({
          type: 'asset',
          fileName,
          source: css
        })
      }

      compiledScssMap.clear()
    }
  }
}

const pcDist = resolve(PC_ROOT, 'dist')
const stylesDist = resolve(STYLES_ROOT, 'dist')
const directivesDist = resolve(DIRECTIVES_ROOT, 'dist')

/** PC 包内各组件 style.ts 与 global-styles（需在主构建之后、同一 dist 下追加） */
export async function buildPcStyleEntries() {
  await tsdownBuild({
    cwd: ROOT,
    alias: { ...workspaceAliases },
    logLevel: 'warn',
    entry: [
      'packages/pc/src/components/**/style.ts',
      'packages/pc/src/global-styles.ts'
    ],
    plugins: [scssPlugin(pcDist, true)],
    unbundle: true,
    clean: false,
    platform: 'browser',
    format: ['es'],
    dts: false,
    outDir: pcDist
  })
}

/** @ultra-ui/styles 包：主题与 normalize 等（含 SCSS） */
export async function buildStylesPackage() {
  await tsdownBuild({
    cwd: STYLES_ROOT,
    entry: ['src/index.ts'],
    alias: { ...workspaceAliases },
    plugins: [scssPlugin(stylesDist, false)],
    unbundle: true,
    clean: true,
    platform: 'browser',
    format: ['es'],
    sourcemap: true,
    dts: true,
    outDir: stylesDist,
    external: [/^@ultra-ui\//]
  })
}

/** @ultra-ui/directives 包样式入口 */
export async function buildDirectiveStyleEntries() {
  await tsdownBuild({
    cwd: ROOT,
    alias: { ...workspaceAliases },
    logLevel: 'warn',
    entry: ['packages/directives/src/**/style.ts'],
    plugins: [scssPlugin(directivesDist, false)],
    unbundle: true,
    clean: false,
    platform: 'browser',
    format: ['es'],
    dts: false,
    outDir: directivesDist
  })
}

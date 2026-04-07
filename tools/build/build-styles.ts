import { dirname, join, relative, resolve, sep } from 'node:path'
import { compileAsync } from 'sass-embedded'
import {
  DESKTOP_SRC,
  DIRECTIVES_SRC,
  DIST_ROOT,
  PACKAGES,
  UTILS_SRC,
  workspaceTsAliases
} from './shared'
import { build as tsdownBuild } from 'tsdown'
import type { ModuleFormat, Plugin } from 'rolldown'

const compiledScssMap = new Map<string, { css: string; outputPath: string }>()

function isUnderDir(dir: string, abs: string): boolean {
  const base = resolve(dir) + sep
  const p = resolve(abs)
  return p === resolve(dir) || p.startsWith(base)
}

function isWorkspaceSource(abs: string): boolean {
  return isUnderDir(PACKAGES, abs)
}

/** SCSS 绝对路径 → dist 内相对路径（.css） */
function scssDistRelativePath(absolutePath: string): string {
  if (isUnderDir(DESKTOP_SRC, absolutePath)) {
    return relative(DESKTOP_SRC, absolutePath).replace(/\.scss$/, '.css')
  }
  if (isUnderDir(UTILS_SRC, absolutePath)) {
    return relative(UTILS_SRC, absolutePath).replace(/\.scss$/, '.css')
  }
  if (isUnderDir(DIRECTIVES_SRC, absolutePath)) {
    return join('directives', relative(DIRECTIVES_SRC, absolutePath)).replace(
      /\.scss$/,
      '.css'
    )
  }
  throw new Error(`Unexpected scss path: ${absolutePath}`)
}

function scssPlugin(): Plugin {
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

        if (!isWorkspaceSource(absolutePath)) return null

        if (absolutePath.endsWith('.scss')) {
          const relCss = scssDistRelativePath(absolutePath)
          const cssOutputPath = resolve(DIST_ROOT, relCss)

          if (!compiledScssMap.has(absolutePath)) {
            try {
              const result = await compileAsync(absolutePath, {
                loadPaths: [PACKAGES, dirname(absolutePath)]
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

          let relPath = relative(
            dirname(importer),
            absolutePath.replace(/\.scss$/, '.css')
          )
          if (!relPath.startsWith('.')) relPath = './' + relPath
          return { id: relPath, external: true }
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
        const fileName = relative(DIST_ROOT, outputPath)

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

const styleBuildBase = {
  logLevel: 'warn' as const,
  plugins: [scssPlugin()],
  unbundle: true,
  clean: false,
  platform: 'browser' as const,
  format: ['es'] as ModuleFormat[],
  dts: true,
  outDir: DIST_ROOT,
  alias: { ...workspaceTsAliases }
}

export async function buildStyles() {
  await tsdownBuild({
    ...styleBuildBase,
    cwd: DESKTOP_SRC,
    entry: ['components/**/style.ts']
  })

  await tsdownBuild({
    ...styleBuildBase,
    cwd: DIRECTIVES_SRC,
    entry: ['**/style.ts']
  })

  await tsdownBuild({
    ...styleBuildBase,
    cwd: UTILS_SRC,
    entry: ['styles/index.ts']
  })
}

import fg from 'fast-glob'
import { resolve } from 'node:path'
import { ROOT, DIST_ROOT, UI_ROOT } from './shared'
import { cp, copyFile, readJson, writeFile, writeJson } from '@cat-kit/be'

export async function copy(
  patterns: string | string[],
  srcDir: string,
  destDir: string
) {
  const files = await fg(patterns, { cwd: srcDir })
  await Promise.all(
    files.map(file => cp(resolve(srcDir, file), resolve(destDir, file)))
  )
}

export async function copyFiles() {
  await copyFile(resolve(ROOT, 'README.md'), resolve(DIST_ROOT, 'README.md'))
  await copy(['styles/_*.scss', 'styles/fonts/*'], UI_ROOT, DIST_ROOT)
}

export async function genFiles() {
  const pkgJSON = await readJson(resolve(UI_ROOT, 'package.json'))

  Object.assign(pkgJSON, {
    exports: {
      '.': {
        types: './index.d.ts',
        default: './index.js',
        import: './index.js'
      },
      './*': {
        default: './*',
        import: './*'
      },
      './version': {
        types: './version.d.ts',
        default: './version.js',
        import: './version.js'
      },
      './types': './types/index.d.ts',
      './install': {
        types: './install.d.ts',
        default: './install.js',
        import: './install.js'
      },
      './styles': {
        types: './styles/index.d.ts',
        default: './styles/index.js',
        import: './styles/index.js'
      }
    },
    module: './index.js',
    types: './index.d.ts'
  })

  const version = pkgJSON.version

  await writeFile(
    resolve(DIST_ROOT, 'version.js'),
    `export const version = '${version}'`
  )
  await writeJson(resolve(DIST_ROOT, 'package.json'), pkgJSON)
}

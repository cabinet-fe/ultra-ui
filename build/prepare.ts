import { resolve } from 'node:path'
import { ROOT, DIST_ROOT, UI_ROOT } from './shared'
import { copyFile, readJson, writeFile, writeJson } from '@cat-kit/be'

export async function copyFiles() {
  await copyFile(resolve(ROOT, 'README.md'), resolve(DIST_ROOT, 'README.md'))
  // await copyFile(
  //   resolve(UI_ROOT, 'styles/fonts/Inter.woff2'),
  //   resolve(DIST_ROOT, 'styles/fonts/Inter.woff2')
  // )
  await copyFile(
    resolve(UI_ROOT, 'styles/_vars.scss'),
    resolve(DIST_ROOT, 'styles/_vars.scss')
  )
  await copyFile(
    resolve(UI_ROOT, 'styles/_mixins.scss'),
    resolve(DIST_ROOT, 'styles/_mixins.scss')
  )
  await copyFile(
    resolve(UI_ROOT, 'styles/_functions.scss'),
    resolve(DIST_ROOT, 'styles/_functions.scss')
  )
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

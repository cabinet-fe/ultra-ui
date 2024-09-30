import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { obj } from 'cat-kit/be'
import { updateVersion } from '@helper/build'

const __dirname = dirname(fileURLToPath(import.meta.url))

const rootDir = resolve(__dirname, '..')

const pkg: Record<string, any> = {
  name: 'ultra-ui',
  type: 'module',
  author: 'cabinet-fe',
  description: 'ultra-ui组件库',
  main: './index.js',
  module: './index.js',
  typings: 'index.d.ts',
  keywords: [
    '完全TS开发的Vue3组件库',
    'Vue组件',
    'Vue3',
    'Vue',
    '前端框架',
    'Vue UI'
  ],

  exports: {
    '.': {
      types: './index.d.ts',
      default: './index.js',
      import: './index.js'
    },
    './*': {
      types: './*.d.ts',
      default: './*',
      import: './*'
    }
  }
}

export async function genPackageJson() {
  const pkgJsonPath = resolve(rootDir, 'package.json')

  await updateVersion(pkgJsonPath)

  const rootPkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))

  pkg.version = rootPkgJson.version
  pkg.peerDependencies = {
    ...obj(rootPkgJson.devDependencies).pick(['vue', 'cat-kit', 'icon-ultra'])
  }

  await writeFile(
    resolve(__dirname, '../dist/package.json'),
    JSON.stringify(pkg, null, 2),
    'utf-8'
  )
}

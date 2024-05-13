import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const rootDir = resolve(__dirname, '..')

const rootPkg = JSON.parse(
  readFileSync(resolve(rootDir, 'package.json'), 'utf-8')
)
const pkg = {
  name: 'ultra-ui',
  version: rootPkg.version,
  type: 'module',
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
  peerDependencies: {
    vue: rootPkg.devDependencies.vue,
    'cat-kit': rootPkg.devDependencies['cat-kit'],
    'icon-ultra': rootPkg.devDependencies['icon-ultra']
  },
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
    },
    './resolver': {
      types: './resolver.d.ts',
      default: './resolver.js',
      import: './resolver.js'
    }
  }
}

function genPackageJson() {
  writeFile(
    resolve(__dirname, '../dist/package.json'),
    JSON.stringify(pkg, null, 2),
    'utf-8'
  )
}
genPackageJson()

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
    'icon-ultra': '3.0.3'
  },
  exports: {
    './components': './components/index.js',
    './styles/*': './styles/*',
    './compositions': './compositions/index.js'
  }
}

export function genPackageJson() {
  writeFile(
    resolve(__dirname, '../dist/package.json'),
    JSON.stringify(pkg, null, 2),
    'utf-8'
  )
}

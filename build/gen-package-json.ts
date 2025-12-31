import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { obj } from 'cat-kit/be'
import { updatePkg } from '@builder/cli'

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
    },
    './install': {
      types: './install.d.ts',
      default: './install.js',
      import: './install.js'
    },
    './styles': {
      types: './styles/index.d.ts',
      default: './styles/index.js',
      import: './styles/index.js'
    },
    './version': {
      types: './version.d.ts',
      default: './version.js',
      import: './version.js'
    }
  },

  sideEffects: [
    '*.css',
    './styles/**',
    './install.js',
    './**/style.js',
    './**/style.css'
  ]
}

export async function genPackageJson() {
  const pkgJsonPath = resolve(rootDir, 'package.json')

  await updatePkg(pkgJsonPath)

  const rootPkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))

  pkg.version = rootPkgJson.version
  pkg.peerDependencies = {
    ...obj(rootPkgJson.devDependencies).pick(['vue', 'cat-kit', '@ultra/icon'])
  }

  // 可选依赖：仅在使用特定组件时需要安装
  pkg.optionalDependencies = {
    // UCodeEditor 需要
    codemirror: '^6.0.0',
    '@codemirror/lang-javascript': '^6.2.0',
    '@codemirror/lang-sql': '^6.10.0',
    '@codemirror/lang-java': '^6.0.0',
    '@codemirror/lang-json': '^6.0.0',
    // UExpressionEditor 需要
    lexical: '^0.37.0',
    '@lexical/utils': '^0.37.0',
    // 弹出层组件需要
    '@floating-ui/dom': '^1.7.0',
    // 虚拟滚动需要
    '@tanstack/vue-virtual': '^3.13.0'
  }

  await writeFile(
    resolve(__dirname, '../dist/package.json'),
    JSON.stringify(pkg, null, 2),
    'utf-8'
  )

  await writeFile(
    resolve(__dirname, '../dist/version.js'),
    `export const version = '${pkg.version}'`,
    'utf-8'
  )

  await writeFile(
    resolve(__dirname, '../dist/version.d.ts'),
    `export declare const version: string`,
    'utf-8'
  )
}

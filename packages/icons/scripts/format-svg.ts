import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { optimize } from 'svgo'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = join(__dirname, '..')
const GLOBS = ['src/svg/normal/**/*.svg', 'src/svg/colorful/**/*.svg'] as const

let changed = 0
for (const pattern of GLOBS) {
  const matcher = new Bun.Glob(pattern)
  const files: string[] = []
  for await (const rel of matcher.scan({ cwd: PKG_ROOT })) {
    files.push(join(PKG_ROOT, rel))
  }
  for (const file of files.toSorted()) {
    let input: string
    try {
      input = readFileSync(file, 'utf8')
    } catch (e) {
      console.error(`read failed: ${file}`, e)
      process.exit(1)
    }
    let data: string
    try {
      data = optimize(input, {
        path: file,
        plugins: [
          // 默认的优化插件
          'preset-default',

          // 移除 width 和 height 属性
          { name: 'removeDimensions' },

          // 移除 class 属性
          { name: 'removeAttrs', params: { attrs: ['class'] } }
        ]
      }).data
    } catch (e) {
      console.error(`SVGO error: ${file}`, e)
      process.exit(1)
    }
    if (data !== input) {
      try {
        writeFileSync(file, data, 'utf8')
        changed++
        console.log(file)
      } catch (e) {
        console.error(`write failed: ${file}`, e)
        process.exit(1)
      }
    }
  }
}

console.log(`SVG 格式化完成，变更文件数: ${changed}`)

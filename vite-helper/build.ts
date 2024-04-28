import { readDir } from 'cat-kit/be'
import { writeFile } from 'fs/promises'
import { dirname, resolve } from 'path'
import { rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'
import { fileURLToPath } from 'url'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 获取所有的组件的目录名
 * @param componentsDir 组件目录
 * @returns
 */
async function writeComponentsDirs() {
  const dirs = await readDir(resolve(__dirname, '../ui/components'), {
    readType: 'dir'
  })

  const files = `
  export const componentDirs = ${JSON.stringify(
    dirs.map(dir => dir.name),
    null,
    2
  )}
  `

  writeFile('./component-dirs.js', files)
}

async function buildResolver() {
  const bundle = await rollup({
    input: resolve(__dirname, './resolver.ts'),
    plugins: [
      esbuild({
        minify: false
      }),
      dts({
        outDir: __dirname,
        include: ['./resolver.ts']
      })
    ],
    external: () => true
  })

  bundle.write({
    dir: __dirname,
    format: 'es'
  })
}

async function build() {
  await writeComponentsDirs()
  await buildResolver()
}

build()

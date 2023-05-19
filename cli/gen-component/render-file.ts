import { camelCase } from 'cat-kit/be'
import { mkdir, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { UI_PATH } from '../constants'
import { existsSync } from 'fs'
import prettier from 'prettier'
import { NAME_SPACE } from 'shared'

interface Ctx {
  /** 组件名称 */
  componentName: string
  /** 组件类型 */
  componentType: string
  /** 组件描述 */
  componentDesc?: string
}

const extMap = {
  ts: 'typescript',
  vue: 'vue',
  scss: 'scss',
  json: 'json'
}

/**
 * 写入内容到目标文件
 * @param ctx
 * @param content
 * @param ext 可以是一个文件名或者以.开头的文件后缀， 为文件后缀时会自动拼接组件名
 * @returns
 */
async function write(ctx: Ctx, content: string, ext: string) {
  const targetDir = resolve(UI_PATH, ctx.componentType, ctx.componentName)
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, {
      recursive: true
    })
  }

  const extRE = /\.([A-z\d]+)$/

  return writeFile(
    resolve(targetDir, ext.startsWith('.') ? ctx.componentName + ext : ext),
    prettier.format(content, {
      parser: extMap[ext.match(extRE)![1]!] || 'html',
      singleQuote: true,
      semi: false,

      trailingComma: 'none'
    }),
    'utf-8'
  )
}

export function renderVueFile(ctx: Ctx) {
  const upperCamelCase = camelCase(ctx.componentName, 'upper')

  const componentProps = `${upperCamelCase}Props`

  const content = `
  <template>

  </template>

  <script lang="ts" setup>
  import { ${componentProps} } from './${ctx.componentName}.type'

  defineOptions({
    name: '${NAME_SPACE}${upperCamelCase}'
  })

  defineProps<${componentProps}>()

  </script>
  `

  write(ctx, content, '.vue')
}

export function renderTypeFile(ctx: Ctx) {
  const upperCamelCase = camelCase(ctx.componentName, 'upper')

  const PropsName = `${upperCamelCase}Props`

  const content = `
  /** ${ctx.componentDesc || ctx.componentName}组件属性 */
  export interface ${PropsName} {}
  `

  write(ctx, content, '.type.ts')
}

export function renderIndexFile(ctx: Ctx) {
  const upperCamelCase = camelCase(ctx.componentName, 'upper')

  const content = `
  export { default as ${NAME_SPACE}${upperCamelCase} } from './${ctx.componentName}.vue'
  export * from './${ctx.componentName}.type'
  `

  write(ctx, content, 'index.ts')
}
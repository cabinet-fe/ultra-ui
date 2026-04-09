import { existsSync } from 'fs'
import { cp, mkdir, rm, writeFile } from 'fs/promises'
import { join, resolve } from 'path'

import { format } from 'oxfmt'

import { COMPONENT_PATH, UI_PATH } from '../shared'
import type { ComponentCtx } from './type'

const NAME_SPACE = 'U'

function upperCamelCaseFromKebab(name: string): string {
  return name
    .split(/[-_]/)
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : ''))
    .join('')
}

/**
 * 写入内容到目标文件
 * @param ctx
 * @param content
 * @param ext 可以是一个文件名或者以.开头的文件后缀， 为文件后缀时会自动拼接组件名
 * @returns
 */
async function write(ctx: ComponentCtx, content: string, ext: string) {
  const targetDir = resolve(COMPONENT_PATH, ctx.componentName)
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true })
  }

  const { code } = await format('aa', content, {
    singleQuote: true,
    semi: false,
    trailingComma: 'none'
  })

  const filePath = resolve(targetDir, ext.startsWith('.') ? ctx.componentName + ext : ext)

  await writeFile(filePath, code, 'utf-8')

  return filePath
}

export function renderVueFile(ctx: ComponentCtx) {
  const upperCamelCase = upperCamelCaseFromKebab(ctx.componentName)

  const componentProps = `${upperCamelCase}Props`

  const rootEle = ctx.rootElement || 'div'

  const content = `
  <template>
    <${rootEle} :class="cls.b">

    </${rootEle}>
  </template>

  <script lang="ts" setup>
  import type { ${componentProps} } from '@ultra-ui/desktop/types'
  import { bem } from '@ultra-ui/utils'

  defineOptions({
    name: '${upperCamelCase}'
  })

  defineProps<${componentProps}>()

  const cls = bem('${ctx.componentName}')
  </script>
  `

  write(ctx, content, '.vue')
}

export function renderTypeFile(ctx: ComponentCtx) {
  const upperCamelCase = upperCamelCaseFromKebab(ctx.componentName)

  const PropsName = `${upperCamelCase}Props`

  const EmitsName = `${upperCamelCase}Emits`

  const content = `
  import type { DeconstructValue } from '@ultra-ui/utils/types/helper'

  /** ${ctx.componentDesc || ctx.componentName}组件属性 */
  export interface ${PropsName} {
    modelValue?: string
  }

  /** ${ctx.componentDesc || ctx.componentName}组件定义的事件 */
  export interface ${EmitsName} {
    (e: 'update:modelValue', value: string): void
  }

  /** ${ctx.componentDesc || ctx.componentName}组件暴露的属性和方法(组件内部使用) */
  export interface _${upperCamelCase}Exposed {

  }

  /** ${
    ctx.componentDesc || ctx.componentName
  }组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
  export type ${upperCamelCase}Exposed = DeconstructValue<_${upperCamelCase}Exposed>

  `

  write(ctx, content, '.ts').then(async (filePath) => {
    await cp(filePath, join(UI_PATH, 'types', ctx.componentName + '.ts'))
    rm(filePath)
  })
}

export function renderIndexFile(ctx: ComponentCtx) {
  const upperCamelCase = upperCamelCaseFromKebab(ctx.componentName)

  const content = `
  export { default as ${NAME_SPACE}${upperCamelCase} } from './${ctx.componentName}.vue'
  `

  write(ctx, content, 'index.ts')
}

export function renderStyleFile(ctx: ComponentCtx) {
  const scssContent = `
  @use 'pkg:@ultra-ui/styles/mixins' as m;
  @use 'pkg:@ultra-ui/styles/functions' as fn;
  @use 'pkg:@ultra-ui/styles/vars';

  // 方便拼接
  $root-name: ${ctx.componentName};

  @include m.b($root-name) {}
  `

  write(ctx, scssContent, 'style.scss')

  const styleEntryContent = `
  import './style.scss'
  `

  write(ctx, styleEntryContent, 'style.ts')
}

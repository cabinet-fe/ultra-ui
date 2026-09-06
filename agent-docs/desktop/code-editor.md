---
title: "UCodeEditor - 代码编辑器"
description: "用 langs 与 v-model:lang 选择语言，独立使用走 v-model，表单内用 field"
keywords:
  - UCodeEditor
  - @veltra/desktop
  - code-editor
  - CodeEditor
  - 代码编辑器
aliases: ["code-editor", "UCodeEditor", "CodeEditor", "代码编辑器"]
---
## 快速上手

```ts
import { UCodeEditor } from '@veltra/desktop'
```

## 典型示例

`UCodeEditor` 绑定字符串。`langs` 多于一种时顶部出现语言选择器，仅一种时显示语言名。当前语言用 `lang` / `v-model:lang`。`lang` 取值：`'js' | 'sql' | 'java' | 'json' | 'markdown' | 'spel' | 'bash' | 'powershell'`。`zoomable` 默认 `true`。独立使用用 `v-model`；放进 `UForm` 时写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { CodeEditorLang } from '@veltra/desktop'

const code = shallowRef('console.log(1)')
const lang = shallowRef<CodeEditorLang>('js')
</script>

<template>
  <u-code-editor
    v-model="code"
    v-model:lang="lang"
    :langs="['js', 'json', 'sql']"
    :default-lines="8"
  />
  <u-code-editor v-model="code" lang="json" :langs="['json']" :zoomable="false" />
</template>
```

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ snippet: '' })
</script>

<template>
  <u-form :model="form">
    <u-code-editor label="脚本" field="snippet" :langs="['js']" />
  </u-form>
</template>
```

## API 签名 / 类型定义

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type PresetRule = 'email' | 'phone' | 'num' | 'url' | 'idCard'

export interface ValidateRule {
  /** 是否必填 */
  required?: boolean | string
  /** 长度单位 */
  length?: number | [number, string]
  /** 最小值 */
  min?: number | [number, string]
  /** 最大值 */
  max?: number | [number, string]
  /** 最小长度 */
  minLen?: number | [number, string]
  /** 最大长度 */
  maxLen?: number | [number, string]
  /** 匹配 */
  match?: RegExp | [RegExp, string] | string
  /** 预设 */
  preset?: PresetRule
  /** 自定义校验 */
  validator?: (value: any, data: Record<string, any>) => Promise<string> | string
}

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export interface FormComponentProps extends ComponentProps {
  /** 在表单控件内时的提示 */
  tips?: string
  /** 所占列的大小 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 表单标签文字 */
  label?: string
  /** 表单项字段 */
  field?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 校验规则 */
  rules?: ValidateRule
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export type CodeEditorLang =
  | 'js'
  | 'sql'
  | 'java'
  | 'json'
  | 'markdown'
  | 'spel'
  | 'bash'
  | 'powershell'

/** 代码编辑器组件属性（不支持 `size`） */
export interface CodeEditorProps extends Omit<FormComponentProps, 'size'> {
  modelValue?: string
  /**
   * 可选语言列表。长度大于 1 时在顶部工具栏显示内置语言选择器；
   * 仅一种语言时显示语言名称标签
   */
  langs?: CodeEditorLang[]
  /** 当前语言，配合 `v-model:lang` 使用 */
  lang?: CodeEditorLang
  /** 不可编辑的前缀外壳（展示在编辑器内，不计入 v-model） */
  prefix?: string
  /** 不可编辑的后缀外壳（展示在编辑器内，不计入 v-model） */
  suffix?: string
  /** 是否使用暗色主题 */
  dark?: boolean
  /** 是否显示放大按钮，默认 true；false 时不渲染放大按钮 */
  zoomable?: boolean
  /**
   * 默认显示的行数，用于撑起编辑器最小高度，超出后滚动
   * @default 8
   */
  defaultLines?: number
}

/** 代码编辑器组件定义的事件 */
export interface CodeEditorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:lang', value: CodeEditorLang | undefined): void
  /** 在编辑器失焦且内容有变更时触发 */
  (e: 'change', value: string): void
}

/** 代码编辑器组件暴露的属性和方法(组件内部使用) */
export interface _CodeEditorExposed {}

/** 代码编辑器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CodeEditorExposed = DeconstructValue<_CodeEditorExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。
- 语言标识与放大按钮在编辑区之外的顶部工具栏：`langs` 多于一种时显示语言选择器，仅一种时显示语言名称标签。`zoomable`（默认 `true`）为 `false` 时不渲染放大按钮。放大复用同一编辑器实例（Teleport 到屏幕中央遮罩），Esc 或关闭按钮退出，内容、撤销历史与禁用/只读状态保持连续。

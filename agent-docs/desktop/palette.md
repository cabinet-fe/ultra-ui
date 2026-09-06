---
title: "UPalette - 调色板"
description: "用 UPalette 选择颜色，绑定值为 HEX 字符串"
---

# UPalette - 调色板

## 引入

```ts
import { UPalette } from '@veltra/desktop'
```

## 示例

`UPalette` 的 `modelValue` 是颜色字符串。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const color = ref('#1E88E5')
</script>

<template>
  <u-palette v-model="color" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ brand: '#1E88E5' })
</script>

<template>
  <u-form :model="form">
    <u-palette label="品牌色" field="brand" size="small" />
  </u-form>
</template>
```

## API / 类型

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

/** 色调 */
export interface PaletteRGB {
  r: number
  g: number
  b: number
}

/** 饱和度 亮度 */
export interface PaletteHSV {
  h: number
  s: number
  v: number
}

/** 调色盘组件颜色类型 */
export type PaletteColorType = 'HEX' | 'RGB'

/** 调色盘组件属性 */
export interface PaletteProps extends FormComponentProps {
  modelValue?: string
  disabled?: boolean
  readonly?: boolean
}

/** 调色盘组件定义的事件 */
export interface PaletteEmits {
  (e: 'update:modelValue', value: string): void
}

/** 调色盘组件暴露的属性和方法(组件内部使用) */
export interface _PaletteExposed {}

/** 调色盘组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaletteExposed = DeconstructValue<_PaletteExposed>
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。

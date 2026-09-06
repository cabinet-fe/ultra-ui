---
title: "USlider - 滑块"
description: "用 USlider 选择数值或数值范围，表单内用 field 绑定"
keywords:
  - USlider
  - @veltra/desktop
  - slider
  - Slider
  - 滑块
aliases: ["slider", "USlider", "Slider", "滑块"]
---
## 快速上手

```ts
import { USlider } from '@veltra/desktop'
```

## 典型示例

`USlider` 默认区间 0–100。`range` 为真时绑定值是 `[number, number]`。`step` 会显示刻度。`vertical` 为垂直滑块，通常需要给容器高度。独立使用走 `v-model`；放进 `UForm` 必须写 `field`，不要再写 `v-model`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

const volume = ref(40)
const span = ref<[number, number]>([20, 80])
</script>

<template>
  <u-slider v-model="volume" :min="0" :max="100" :step="10" />
  <u-slider v-model="span" range />
  <u-slider v-model="volume" vertical style="height: 200px" />
</template>
```

表单内绑定：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ opacity: 80 })
</script>

<template>
  <u-form :model="form">
    <u-slider label="不透明度" field="opacity" :min="0" :max="100" />
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

/** 滑块组件属性 */
export interface SliderProps<T extends number | [number, number]> extends FormComponentProps {
  modelValue?: T
  /**
   * 最小值
   * @default 0
   */
  min?: number
  /**
   * 最大值
   * @default 100
   */
  max?: number
  /**
   * 步长
   * - 如果设置步长, 则滑块会按照步长进行滑动
   * - 同时，滑块上将会显示步长刻度
   */
  step?: number
  /** 是否是范围滑块 */
  range?: boolean
  /** 是否是垂直模式 */
  vertical?: boolean
}

/** 滑块组件定义的事件 */
export interface SliderEmits<T extends number | [number, number]> {
  (e: 'update:modelValue', value: T): void
}

/** 滑块组件暴露的属性和方法(组件内部使用) */
export interface _SliderExposed {}

/** 滑块组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SliderExposed = DeconstructValue<_SliderExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。

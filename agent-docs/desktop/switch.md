---
title: "USwitch - 开关"
description: "开关与开/关文案，以及在 UForm 内用 field 绑定"
keywords:
  - USwitch
  - @veltra/desktop
  - switch
  - Switch
  - 开关
aliases: ["switch", "USwitch", "Switch", "开关"]
---
## 快速上手

```ts
import { USwitch } from '@veltra/desktop'
```

## 典型示例

值为布尔。`active-text` / `inactive-text` 分别显示在开、关侧。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const enabled = ref(false)
</script>

<template>
  <u-switch v-model="enabled" />
  <u-switch v-model="enabled" active-text="开" inactive-text="关" />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ enabled: true, notification: false })
</script>

<template>
  <u-form :model="form">
    <u-switch label="启用状态" field="enabled" active-text="启用" inactive-text="禁用" />
    <u-switch label="推送通知" field="notification" />
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

/** 开关组件属性 */
export interface SwitchProps extends FormComponentProps {
  /** 开关状态 */
  modelValue?: boolean
  /** 打开时显示的文字 */
  activeText?: string
  /** 关闭时显示的文字 */
  inactiveText?: string
}

/** 开关组件定义的事件 */
export interface SwitchEmits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'change', value: boolean): void
}

/** 开关组件暴露的属性和方法(组件内部使用) */
export interface _SwitchExposed {}

/** 开关组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type SwitchExposed = DeconstructValue<_SwitchExposed>
```

## 注意事项

- 在 UForm 中必须使用 field，禁止 v-model。

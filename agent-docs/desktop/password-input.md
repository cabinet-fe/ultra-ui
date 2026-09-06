---
title: "UPasswordInput - 密码输入框"
description: "密码输入与明文切换，以及在 UForm 内用 field 绑定"
---

# UPasswordInput - 密码输入框

## 引入

```ts
import { UPasswordInput } from '@veltra/desktop'
```

## 示例

继承 `UInput` 的占位、清空等能力，并带明文/密文切换。独立使用走 `v-model`；放进 `UForm` 时用 `field`，不要再写 `v-model`。需要把密码放进自定义 `UFormItem` 时，Item 写 `field`，内部 `UPasswordInput` 自行 `v-model`。

独立使用：

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const password = shallowRef('')
</script>

<template>
  <u-password-input v-model="password" placeholder="请输入密码" clearable />
</template>
```

在 `UForm` 中：

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ password: '' })
</script>

<template>
  <u-form :model="form">
    <u-password-input
      label="密码"
      field="password"
      placeholder="至少 6 位"
      :rules="{ required: true, minLen: 6 }"
    />
  </u-form>
</template>
```

## API / 类型

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

export interface InputProps extends FormComponentProps {
  /** modelValue */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 前缀 */
  prefix?: string
  /** 后缀 */
  suffix?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 原生只读 */
  nativeReadonly?: boolean
  /**
   * 模式
   * @description 如果指定请保证有一个符合模式的默认值
   */
  pattern?: RegExp
}

/** 密码输入组件属性 */
export interface PasswordInputProps extends InputProps {
  modelValue?: string
}

/** 密码输入组件定义的事件 */
export interface PasswordInputEmits {
  (e: 'update:modelValue', value: string): void
}

/** 密码输入组件暴露的属性和方法(组件内部使用) */
export interface _PasswordInputExposed {}

/** 密码输入组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PasswordInputExposed = DeconstructValue<_PasswordInputExposed>
```

## 避坑与使用要点

- 在 UForm 中必须使用 field，禁止 v-model。

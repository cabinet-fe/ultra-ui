---
title: "UForm - 表单"
description: "用 field 绑定 model、校验与重置；禁止与 v-model 并用"
---

# UForm - 表单

## 引入

```ts
import { UForm } from '@veltra/desktop'
```

## 示例

`UForm` 拦截默认插槽里带 `field` 的子组件，自动生成 `UFormItem`，并按 `field` 路径读写 `model`。控件必须写 `field`；有 `field` 就不要再写 `v-model`。`validate()` 全量校验，`validate(['field'])` 按字段校验；`reset()` 恢复最近一次 `props.model` 引用变更时的快照并清除校验。

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/desktop'
import { reactive, shallowRef } from 'vue'

const formRef = shallowRef<FormExposed>()
const form = reactive({
  username: '',
  email: '',
  age: 18
})

async function handleSubmit() {
  const valid = await formRef.value?.validate()
  if (valid) console.log('提交', form)
}

function handleReset() {
  formRef.value?.reset()
}
</script>

<template>
  <u-form ref="formRef" :model="form" label-width="100px" :cols="1">
    <u-input
      label="用户名"
      field="username"
      :rules="{ required: '用户名不能为空', minLen: [2, '至少 2 个字符'] }"
    />
    <u-input label="邮箱" field="email" :rules="{ required: true, preset: 'email' }" />
    <u-number-input label="年龄" field="age" :min="0" :max="150" :rules="{ min: 0, max: 150 }" />
  </u-form>
  <u-button type="primary" @click="handleSubmit">提交</u-button>
  <u-button @click="handleReset">重置</u-button>
</template>
```

嵌套路径用 `a.b`。需要多控件组合同一字段时才显式写 `UFormItem`：`field` 写在 Item 上，内部控件自行 `v-model`，且不要再写 `field`。

## API / 类型

```ts
export type ComponentSize = 'small' | 'default' | 'large'

export interface ComponentProps {
  /** 组件尺寸 */
  size?: ComponentSize
}

export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { ShallowRef } from 'vue'

/** 表单组件属性 */
export interface FormProps extends ComponentProps {
  /**
   * 自定义表单列数
   * - 默认根据尺寸断点自动排列
   */
  cols?: number
  /** 表单数据 */
  model?: Record<string, any>
  // showModified?: boolean
  /** 表单项label宽度 */
  labelWidth?: string | number
  /** 表单项 label 位置 */
  labelPosition?: 'top' | 'left'
  /** 是否不显示tips */
  noTips?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
}

export interface FormEmits {
  (e: 'field:change', field: string, value: any): void
}

export interface _FormExposed {
  el: ShallowRef<HTMLElement | null | undefined>
  validate: (keys?: string[]) => Promise<boolean>
  clearValidate: () => void
  /** 将 model 恢复为最近一次 props.model 引用变更时的快照，并清除校验 */
  reset: () => void
}

export type FormExposed = DeconstructValue<_FormExposed>
```

## 避坑与使用要点

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。

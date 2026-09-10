---
title: "UCheckboxGroup 复选框组"
description: "复选框组，用 items 渲染一组选项并把选中的 value 收集为数组；支持自定义 label/value 字段名、整组禁用、块级排列，可在 UForm 内用 field 绑定表单字段。"
aliases: [checkbox-group, CheckboxGroup, 复选框组, 多选组, 勾选组]
keywords:
  - modelValue
  - items
  - labelKey
  - valueKey
  - block
  - field
  - rules
  - update:modelValue
  - 勾选组
  - 多选组
  - 批量勾选
  - 值数组
  - 表单多选
  - 全选
---

# UCheckboxGroup 复选框组

`@veltra/desktop` 导出 `UCheckboxGroup`。它按 `items` 渲染一组 `UCheckbox`，把选中项的 `value` 收集为**数组**写入 `modelValue`；需要单个布尔勾选（同意条款、独立开关型确认）时用 `UCheckbox`（见 `agent-docs/desktop/checkbox.md`）。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckboxGroup } from '@veltra/desktop'

const checked = ref<string[]>([])
const items = [
  { label: '苹果', value: 'apple' },
  { label: '香蕉', value: 'banana' },
  { label: '橙子', value: 'orange' }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" />
  <!-- => 勾选“苹果”“橙子”后 checked 为 ['apple', 'orange'] -->
</template>
```

## API 签名

```ts
import type { FormComponentProps } from '@veltra/utils'

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 选中项 value 组成的数组 */
  modelValue?: Array<any>
  /** 复选框项，必填 */
  items: Array<Record<string, any>>
  /** 标签文本的字段名。默认 'label' */
  labelKey?: string
  /** 值的字段名。默认 'value'；项的该字段值必须为 truthy */
  valueKey?: string
  /** 块级显示（纵向排列）。默认 false（横向排列） */
  block?: boolean
}

/** 复选框组, 用来选择一组数据组件属性 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}

/** 复选框组, 用来选择一组数据暴露的属性和方法（空对象：ref 上无公开方法） */
export interface CheckboxGroupExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `Array<any>` | — | 否 | 选中项 `value` 的数组；勾选/取消都产生新数组 |
| `items` | `Array<Record<string, any>>` | — | 是 | 选项列表；每项必须有 `valueKey` 指向的字段，且其值必须为 truthy |
| `labelKey` | `string` | `'label'` | 否 | 选项文本字段名；空串按 `'label'` 处理 |
| `valueKey` | `string` | `'value'` | 否 | 选项值字段名；空串按 `'value'` 处理 |
| `block` | `boolean` | `false` | 否 | `true` 时选项纵向排列，`false` 时横向排列 |
| **继承自 `FormComponentProps`** | | | | |
| `size` | `ComponentSize` | `'default'` | 否 | `'small'` \| `'default'` \| `'large'`；未设置时继承 `<u-form>` 的 `size` |
| `label` | `string` | — | 否 | 表单标签文字；仅在 `UForm` / `UFormItem` 内生效 |
| `field` | `string` | — | 否 | `UForm` 字段名；在 `UForm` 内必须用 `field` 绑定，禁止再写 `v-model` |
| `tips` | `string` | — | 否 | 表单内提示文字；仅在 `UForm` / `UFormItem` 内生效 |
| `span` | `number \| 'full' \| { default, xs?, sm?, md?, lg?, xl? }` | — | 否 | 表单中所占列数；`'full'` 占满一行，响应式对象的 `default` 必填 |
| `disabled` | `boolean` | `false` | 否 | 整组禁用；未设置时继承 `<u-form>` 的 `disabled` |
| `readonly` | `boolean` | `false` | 否 | 只读：渲染选中项文本为标签列表，无选中时显示 `-` |
| `rules` | `ValidateRule` | — | 否 | 校验规则（如 `{ required: true }`）；仅在 `UForm` 内生效 |

## 方法与事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `value: Array<any>` | 任一选项勾选状态变化后，发出勾选后完整的值数组 |

组件只有 `update:modelValue`，没有 `change` 事件；要监听变化用 `v-model` 配合 `watch`，或直接监听 `@update:model-value`。组件未 `defineExpose` 任何方法。

## 典型示例

### 自定义字段名与纵向排列

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckboxGroup } from '@veltra/desktop'

const checked = ref<number[]>([])
const users = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="users" label-key="name" value-key="id" />
  <!-- => 勾选“张三”后 checked 为 [1] -->
  <u-checkbox-group v-model="checked" :items="users" label-key="name" value-key="id" block />
  <!-- => block 时选项纵向排列 -->
</template>
```

### 全选联动 UCheckbox

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { UCheckbox, UCheckboxGroup } from '@veltra/desktop'

const items = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' },
  { label: '音乐', value: 'music' }
]
const hobbies = ref<string[]>([])

const allChecked = computed(() => hobbies.value.length === items.length)
const indeterminate = computed(
  () => hobbies.value.length > 0 && hobbies.value.length < items.length
)

function handleCheckAll(checked: boolean) {
  hobbies.value = checked ? items.map((item) => item.value) : []
}
</script>

<template>
  <u-checkbox :model-value="allChecked" :indeterminate="indeterminate" @change="handleCheckAll">
    全部爱好
  </u-checkbox>
  <u-checkbox-group v-model="hobbies" :items="items" />
</template>
```

### 在 UForm 内用 field 绑定

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { UForm, UCheckboxGroup } from '@veltra/desktop'

const formData = reactive({ hobbies: ['reading'] as string[] })
const hobbyList = [
  { label: '阅读', value: 'reading' },
  { label: '运动', value: 'sports' }
]
</script>

<template>
  <!-- 有 field 就不要再写 v-model；值写入 formData.hobbies -->
  <u-form :model="formData">
    <u-checkbox-group label="爱好" field="hobbies" :items="hobbyList" :rules="{ required: true }" />
  </u-form>
</template>
```

## 注意事项

> [!WARNING]
> - 选项的值字段（`valueKey` 指向的字段）取值必须为 truthy：`0`、`''`、`null` 无法勾选也无法回显选中状态。
> - `modelValue` 是数组，不是单个布尔值；禁止把布尔值绑给 `UCheckboxGroup`。
> - 本库没有 `change` 事件，监听变化用 `@update:model-value` 或 `watch` 值数组。
> - 需要单个布尔勾选用 `UCheckbox`；需要收集一组值用 `UCheckboxGroup`，禁止手写一组 `UCheckbox` 再各自绑定同一个数组字段。
> - 在 `UForm` 内必须用 `field` 绑定字段，有 `field` 时禁止再写 `v-model`；`label` / `tips` / `span` / `rules` 仅在 `UForm` / `UFormItem` 内生效。
> - 组件颜色来自 `--u-*` token：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则组件无颜色。

## 常见问题

### 勾选后 `modelValue` 没有变化

原因：该选项 `valueKey` 指向的字段值为 falsy（`0`、`''`、`null`），勾选与回显均被忽略。修复：为每项提供 truthy 的值字段，或改用其他字段并通过 `value-key` 指定：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckboxGroup } from '@veltra/desktop'

const checked = ref<number[]>([])
// id 为 0 时勾选无效，改为从 1 开始
const items = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-checkbox-group v-model="checked" :items="items" label-key="name" value-key="id" />
</template>
```

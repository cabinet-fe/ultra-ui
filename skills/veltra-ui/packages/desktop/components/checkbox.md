# UCheckbox — 复选框

> `import type { CheckboxProps, CheckboxEmits, CheckboxExposed } from '@veltra/desktop'`

单一复选框组件，支持 `v-model` 双向绑定、半选状态（`indeterminate`），可嵌入表单上下文自动继承 `disabled`、`readonly`、`size`。

## Import

```ts
// UCheckbox 由 Vite 自动导入，无需手动 import
```

## Props

| prop            | type                                                                                                                                                                   | default     | 说明                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `modelValue`    | `boolean`                                                                                                                                                              | —           | 是否选中                     |
| `indeterminate` | `boolean`                                                                                                                                                              | —           | 部分选中，展示「半选」图标   |
| `size`          | `'small' \| 'default' \| 'large'`                                                                                                                                      | `'default'` | 组件尺寸                     |
| `disabled`      | `boolean`                                                                                                                                                              | `false`     | 是否禁用                     |
| `readonly`      | `boolean`                                                                                                                                                              | `false`     | 是否只读（点击不触发变更）   |
| `tips`          | `string`                                                                                                                                                               | —           | 在表单控件内时的提示文字     |
| `label`         | `string`                                                                                                                                                               | —           | 表单标签文字                 |
| `field`         | `string`                                                                                                                                                               | —           | 表单项字段，用于表单校验关联 |
| `span`          | `number \| 'full' \| { xs?: number \| 'full'; sm?: number \| 'full'; md?: number \| 'full'; lg?: number \| 'full'; xl?: number \| 'full'; default: number \| 'full' }` | —           | 在表单布局中所占列的大小     |

> `size`、`disabled`、`readonly` 默认值由 `useFormFallbackProps` 提供；若组件嵌套在 `<u-form>` 内部，会优先继承表单上下文的对应值。

## Emits

| event               | 参数                                | 说明                                 |
| ------------------- | ----------------------------------- | ------------------------------------ |
| `update:modelValue` | `checked: boolean`                  | `v-model` 值变更时触发               |
| `change`            | `checked: boolean`, `e: MouseEvent` | 选中状态改变时触发（含原生鼠标事件） |

## Slots

| slot      | 作用域 | 说明                 |
| --------- | ------ | -------------------- |
| `default` | —      | 复选框右侧的标签文本 |

## Exposed

```ts
interface CheckboxExposed {}
```

## Examples

### 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'
const agreed = ref(false)
</script>

<template>
  <u-checkbox v-model="agreed">我已阅读并同意</u-checkbox>
</template>
```

### 半选状态（全选场景）

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
const checkedItems = ref<string[]>([])
const options = ['苹果', '香蕉', '橙子']

const isChecked = computed(() => checkedItems.value.length === options.length)
const isIndeterminate = computed(
  () => checkedItems.value.length > 0 && checkedItems.value.length < options.length
)

function handleCheckAll(checked: boolean) {
  checkedItems.value = checked ? [...options] : []
}
</script>

<template>
  <u-checkbox :model-value="isChecked" :indeterminate="isIndeterminate" @change="handleCheckAll">
    全选
  </u-checkbox>
</template>
```

### 禁用与只读

```vue
<template>
  <u-checkbox v-model="checked" disabled>禁用状态</u-checkbox>
  <u-checkbox v-model="checked" readonly>只读状态</u-checkbox>
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写 `u-form-item` 和 `v-model`。

```vue
<script setup lang="ts">
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({ remember: formField({ value: false }) })
</script>

<template>
  <u-form :model="model" disabled>
    <u-checkbox label="记住登录" field="remember">30 天内免登录</u-checkbox>
  </u-form>
</template>
```

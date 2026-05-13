# UCheckboxGroup — 复选框组

> `import type { CheckboxGroupProps, CheckboxGroupEmits, CheckboxGroupExposed } from '@veltra/desktop'`

复选框组，渲染一组 `UCheckbox` 用于多选。支持 `v-model` 双向绑定选中值数组。只读模式下自动切换为 `UTag` 标签展示。

## Import

```ts
import { UCheckboxGroup } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `Array<any>` | — | 选中的值数组，支持 `v-model`
| `items` | `Array<Record<string, any>>` | — | 复选框项数据源
| `labelKey` | `string` | `'label'` | 从 `items` 每一项中提取标签文本的 key
| `valueKey` | `string` | `'value'` | 从 `items` 每一项中提取值的 key
| `block` | `boolean` | `false` | 块级显示，复选框纵向排列

继承 `FormComponentProps`（`size`、`disabled`、`readonly`、`tips`、`span`、`label`、`field`）。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: Array<any>)` — 选中值变化时触发

## Examples

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UCheckboxGroup } from '@veltra/desktop'

const selected = ref([])

const options = [
  { label: '选项一', value: '1' },
  { label: '选项二', value: '2' },
  { label: '选项三', value: '3' },
]
</script>

<template>
  <u-checkbox-group v-model="selected" :items="options" />
</template>
```

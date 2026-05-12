# UGroupInput — 分组输入

> `import type { GroupInputProps, GroupInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UGroupInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `GroupItem[]` | — | 分组数据
| `max` | `number` | — | 最大条目数
| `creatable` | `boolean` | — | 是否允许新建
| `itemDefault` | `Record<string, any>` | — | 新建条目的默认值
| `itemStyle` | `StyleValue` | — | 条目样式，作用于每个 `<li>`，支持 CSS 字符串、对象或对象数组

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(modelValue: GroupItem[])` — 数据变化

## Examples

### 基础用法

```vue
<u-group-input v-model="items" />
```

### 设置条目样式

`itemStyle` 接受 Vue 的 `StyleValue` 类型，支持多种传入方式。

**CSS 字符串：**

```vue
<u-group-input
  v-model="items"
  item-style="padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; margin-bottom: 8px"
/>
```

**CSS 对象：**

```vue
<script setup>
const itemStyle = {
  padding: '12px',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  marginBottom: '8px',
  background: 'var(--bg-secondary)'
}
</script>

<template>
  <u-group-input v-model="items" :item-style="itemStyle" />
</template>
```

**响应式样式：**

```vue
<script setup>
import { computed } from 'vue'

const items = ref([])
const itemStyle = computed(() => ({
  padding: '8px 12px',
  borderLeft: '3px solid var(--color-primary)',
  marginBottom: items.value.length > 3 ? '4px' : '12px'
}))
</script>

<template>
  <u-group-input v-model="items" :item-style="itemStyle" />
</template>
```

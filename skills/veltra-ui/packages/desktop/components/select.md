# USelect — 单选选择器

> `import type { SelectProps } from '@veltra/desktop'`

继承 `FormComponentProps`，支持下拉选择、搜索过滤、远程加载、可创建、网格布局。

## Import

```ts
import { USelect } from '@veltra/desktop'
// 或按需
import { USelect } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `any` | — | 选中值（对应 `valueKey`） |
| `text` | `string` | — | 显示文本 (`v-model:text`) |
| `options` | `Record[] \| ((qs: string) => Promise<Record[]>)` | — | 选项列表，传函数强制 filterable |
| `valueKey` | `string` | `'value'` | 值字段 |
| `labelKey` | `string` | `'label'` | 标签字段 |
| `clearable` | `boolean` | `true` | 可清除 |
| `placeholder` | `string` | `'请选择'` | 占位符 |
| `filterable` | `boolean` | — | 启用搜索过滤 |
| `creatable` | `boolean` | — | 允许创建新选项 |
| `grid` | `{ cols: number; gap?: number }` | — | 网格布局 |
| `contentStyle` | `CSSProperties \| string` | — | 下拉面板样式 |
| `minWidth` | `string` | — | 面板最小宽度 |
| `width` | `string` | — | 面板宽度 |
| `size` | `ComponentSize` | — | 尺寸 |
| `disabled` | `boolean` | — | 禁用 |
| `readonly` | `boolean` | — | 只读 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(value?: any)` | 选中值变化 |
| `update:label` | `(label?: string)` | 显示文本变化 |
| `change` | `(option?: Record)` | 选中项变化 |

## Slots

| slot | 作用域 | 说明 |
|------|--------|------|
| `default` | `{ option: Record, index: number }` | 自定义选项渲染 |
| `prefix` | — | 前缀内容 |

## Examples

### 基础选择

```vue
<script setup>
import { shallowRef } from 'vue'
const city = shallowRef('')

const cities = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' }
]
</script>

<template>
  <u-select v-model="city" :options="cities" placeholder="请选择城市" />
</template>
```

### 可搜索 + 可创建 + 自定义 valueKey/labelKey

```vue
<script setup>
import { shallowRef } from 'vue'
const selected = shallowRef()

const options = [
  { name: '张三', id: 1 },
  { name: '李四', id: 2 }
]
</script>

<template>
  <u-select
    v-model="selected"
    :options="options"
    value-key="id"
    label-key="name"
    filterable
    creatable
    placeholder="选择或创建"
  />
</template>
```

### 异步远程搜索

```vue
<u-select
  v-model="product"
  value-key="id"
  label-key="name"
  :options="async (qs) => {
    if (!qs) return []
    const res = await fetch(`/api/products?q=${qs}`)
    return res.json()
  }"
  filterable
  placeholder="搜索产品..."
/>
```

### 网格布局 + 自定义渲染

```vue
<u-select v-model="color" :options="colorOptions" :grid="{ cols: 4, gap: 8 }" v-slot="{ option }">
  <div style="text-align: center">
    <u-icon :size="24"><Monitor /></u-icon>
    <div>{{ option?.label }}</div>
  </div>
</u-select>
```

### 在 UForm 中联动

```vue
<u-form :model="model">
  <u-select label="年级" field="grade" :options="gradeList" value-key="value" label-key="label" />
</u-form>
```

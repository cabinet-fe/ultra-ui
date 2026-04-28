# UDatePicker — 日期选择器

> `import type { DatePickerProps } from '@veltra/desktop'`

## Import

```ts
import { UDatePicker } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string` | — | 日期值 |
| `type` | `'date'` \| `'month'` \| `'year'` | `'date'` | 日期类型 |
| `format` | `string` | 自动 | 显示格式 |
| `valueFormat` | `string` | — | 值格式 |
| `placeholder` | `string` | `'选择日期'` | 占位符 |
| `clearable` | `boolean` | `true` | 可清除 |
| `disabledDate` | `(date: Dater) => boolean` | — | 禁用日期判断 |
| `size` | `ComponentSize` | — | 尺寸 |
| `disabled` | `boolean` | — | 禁用 |

## Examples

### 基础日期选择

```vue
<script setup>
import { shallowRef } from 'vue'
const date = shallowRef('')
</script>

<template>
  <u-date-picker v-model="date" type="date" />
  <u-date-picker v-model="month" type="month" />
  <u-date-picker v-model="year" type="year" />
</template>
```

### 禁用日期范围

```vue
<script setup>
import { date } from '@cat-kit/core'

const d = shallowRef(date().format('yyyy-MM-dd'))

function disabledDate(d) {
  return d.timestamp <= Date.now()  // 禁用今天之前的日期
}
</script>

<template>
  <u-date-picker v-model="d" type="date" :disabled-date="disabledDate" />
  <p>选中: {{ d }}</p>
</template>
```

### 自定义格式

```vue
<u-date-picker v-model="date" type="date" format="yyyy年MM月dd日" />
```

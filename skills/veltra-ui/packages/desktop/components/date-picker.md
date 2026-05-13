# UDatePicker — 日期选择器

> `import type { DatePickerProps, DatePickerEmits, DatePickerExposed } from '@veltra/desktop'`

基于 `u-dropdown` + `u-input` + `UDatePanel` 组合的日期选择组件，支持日期、月份、年份三种模式。

## Import

```ts
// UDatePicker 由 Vite 自动导入，无需手动 import
```

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `modelValue` | `string \| number \| Date` | — | 选中的日期值 |
| `type` | `'date'` \| `'month'` \| `'year'` | `'date'` | 日期类型 |
| `format` | `string` | 见下方说明 | 显示格式，同时作为 `update:modelValue` 的输出格式 |
| `valueFormat` | `string` | — | 值格式化，未指定时使用 `format`。仅当显示与输出值格式不一致时使用 |
| `placeholder` | `string` | `'选择日期'` | 输入框占位文本 |
| `clearable` | `boolean` | `true` | 是否显示清除按钮 |
| `disabledDate` | `(date: Dater) => boolean` | — | 禁用指定日期的判断函数 |
| `size` | `ComponentSize` | `'default'` | 尺寸，继承自 `FormComponentProps` |
| `disabled` | `boolean` | `false` | 是否禁用，继承自 `FormComponentProps` |
| `readonly` | `boolean` | `false` | 是否只读，继承自 `FormComponentProps` |

`format` 默认值按 `type` 自动推断：

| type | 默认 format |
|------|------------|
| `'date'` | `'yyyy-MM-dd'` |
| `'month'` | `'yyyy-MM'` |
| `'year'` | `'yyyy'` |

另外还继承自 `FormComponentProps` 的 `label`、`field`、`tips`、`span` 等表单通用属性。

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `value?: string \| number \| Date` | 选中日期变化时触发，清除时值为 `undefined` |

## Slots

无。

## Exposed

```ts
interface DatePickerExposed {}
```

组件未暴露任何公开方法或属性。

## Examples

### 基础日期选择

```vue
<script setup>
import { shallowRef } from 'vue'
const date = shallowRef('')
const month = shallowRef('')
const year = shallowRef('')
</script>

<template>
  <u-date-picker v-model="date" type="date" />
  <u-date-picker v-model="month" type="month" />
  <u-date-picker v-model="year" type="year" />
</template>
```

### 禁用日期

```vue
<script setup>
import { date, type Dater } from '@cat-kit/core'
import { shallowRef } from 'vue'

const d = shallowRef('')

function disabledDate(d: Dater) {
  return d.timestamp <= Date.now()
}
</script>

<template>
  <u-date-picker v-model="d" :disabled-date="disabledDate" />
  <p>选中: {{ d }}</p>
</template>
```

### modelValue 传入 Date / number

```vue
<script setup>
import { ref } from 'vue'

const dateRef = ref(new Date())
const timestampRef = ref(Date.now())
</script>

<template>
  <u-date-picker v-model="dateRef" />
  <u-date-picker v-model="timestampRef" />
</template>
```

### 自定义格式

```vue
<template>
  <u-date-picker v-model="date" format="yyyy年MM月dd日" />
  <u-date-picker v-model="month" type="month" format="yyyy/MM" />
</template>
```

### 在 UForm 中使用

> 参考 [form.md](form.md) 了解 FormModel 的完整用法。表单内不需要手写 `u-form-item` 和 `v-model`。

```vue
<script setup>
import { FormModel, formField } from '@veltra/desktop'

const model = new FormModel({
  birthday: formField({ value: '' }),
  joinDate: formField({ value: '' })
})
</script>

<template>
  <u-form :model="model">
    <u-date-picker label="生日" field="birthday" />
    <u-date-picker label="入职日期" field="joinDate" />
  </u-form>
</template>
```

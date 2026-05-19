# UDateRangePicker — 日期范围选择器

> `import type { DateRangePickerProps, DateRangePickerEmits, DateRangePickerExposed } from '@veltra/desktop'`

基于 `UDropdown` + `UDatePanel` 的日期范围选择器，点击触发下拉面板，选择起始和结束日期后自动关闭。通过 `v-model` 绑定 `[起始日期字符串, 结束日期字符串]`。

## Import

```ts
// UDateRangePicker 由 Vite 自动导入，无需手动 import
```

## Props

| prop           | type                          | default                    | 说明                                                                                                              |
| -------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `modelValue`   | `[string, string]`            | —                          | 当前选中的日期范围                                                                                                |
| `placeholder`  | `[string, string]`            | `['起始日期', '结束日期']` | 占位文本，依次为起始、结束输入框                                                                                  |
| `type`         | `'date' \| 'month' \| 'year'` | `'date'`                   | 日期选择类型                                                                                                      |
| `format`       | `string`                      | —                          | 日期格式化字符串。未指定时根据 `type` 自动推断：`date` → `'yyyy-MM-dd'`，`month` → `'yyyy-MM'`，`year` → `'yyyy'` |
| `valueFormat`  | `string`                      | —                          | 日期值格式化。未指定时默认使用 `format`，仅当值与显示内容不一致时使用                                             |
| `disabledDate` | `(date: Dater) => boolean`    | —                          | 禁用指定日期的回调，返回 `true` 则禁用                                                                            |
| `clearable`    | `boolean`                     | `true`                     | 是否显示清除按钮，hover 时出现                                                                                    |

### 继承自 `FormComponentProps`

| prop       | type                              | default     | 说明                               |
| ---------- | --------------------------------- | ----------- | ---------------------------------- |
| `size`     | `'small' \| 'default' \| 'large'` | `'default'` | 组件尺寸                           |
| `disabled` | `boolean`                         | `false`     | 是否禁用                           |
| `readonly` | `boolean`                         | `false`     | 是否只读（只读模式下渲染为纯文本） |
| `label`    | `string`                          | —           | 表单标签文字                       |
| `field`    | `string`                          | —           | 表单项字段名                       |
| `tips`     | `string`                          | —           | 表单控件内的提示信息               |
| `span`     | `number \| 'full' \| {...}`       | —           | 所占列的大小                       |

## Emits

| event               | 参数                         | 说明                   |
| ------------------- | ---------------------------- | ---------------------- |
| `update:modelValue` | `(value?: [string, string])` | 选中日期范围变化时触发 |

## Slots

无公开插槽。

## Exposed

```ts
interface DateRangePickerExposed {}
```

## Examples

### 基础用法

```vue
<u-date-range-picker v-model="range" />
```

### 限制可选日期

```vue
<script setup>
const disabledDate = (d) => d.isBefore(new Date())
</script>
<template>
  <u-date-range-picker v-model="range" :disabled-date="disabledDate" />
</template>
```

### 月份范围选择

```vue
<u-date-range-picker v-model="range" type="month" format="yyyy年MM月" />
```

### 只读模式

```vue
<u-date-range-picker v-model="range" readonly />
```

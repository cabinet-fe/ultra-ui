# UDateRangePicker — 日期范围选择器

> `import type { DateRangePickerProps, DateRangePickerEmits } from '@veltra/desktop'`

## Import

```ts
import { UDateRangePicker } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `[string, string]` | — |
| `placeholder` | `[string, string]` | — |
| `type` | `'date' \| 'month' \| 'year'` | — |
| `format` | `string` | — |
| `valueFormat` | `string` | — |
| `disabledDate` | `Function` | — |
| `clearable` | `boolean` | — |

另有继承自 `FormComponentProps` 的属性。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value?: [string, string])` |

## Exposed

无暴露属性。

## Examples

```vue
<u-date-range-picker v-model="range" />
```

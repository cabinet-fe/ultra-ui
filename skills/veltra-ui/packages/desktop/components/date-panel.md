# UDatePanel — 日期面板

> `import type { DatePanelProps, DatePanelEmits } from '@veltra/desktop'`

## Import

```ts
import { UDatePanel } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `date` | `Dater` | — |
| `rangeDate` | `[Dater, Dater]` | — |
| `range` | `boolean` | — |
| `disabledDate` | `Function` | — |
| `type` | `'date' \| 'month' \| 'year'` | — |
| `size` | `ComponentSize` | — |

## Emits

| event | 参数
|-------|------
| `select:date` | `(date: Dater)` |
| `select:range-date` | `(rangeDate?)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-date-panel v-model="date" />
```

# UCalendar — 日历

> `import type { CalendarProps, CalendarEmits } from '@veltra/desktop'`

## Import

```ts
import { UCalendar } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-calendar v-model="date" />
```

# UGanttChart — 甘特图

> `import type { GanttChartProps, GanttChartEmits } from '@veltra/desktop'`

## Import

```ts
import { UGanttChart } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 当前选中的条目 ID

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 选中项变化

## Examples

```vue
<u-gantt-chart v-model="data" />
```

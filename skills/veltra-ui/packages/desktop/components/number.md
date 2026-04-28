# UNumber — 数字展示

> `import type { NumberProps } from '@veltra/desktop'`

## Import

```ts
import { UNumber } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `value` | `number` | — | 数值
| `format` | `'currency' \| 'percent' \| 'decimal'` | — | 格式化方式
| `align` | `'left' \| 'center' \| 'right'` | — | 对齐方式
| `tween` | `boolean` | `false` | 是否启用动画过渡
| `duration` | `number` | — | 动画时长
| `precision` | `number` | — | 精度
| `maxPrecision` | `number` | — | 最大精度
| `minPrecision` | `number` | — | 最小精度

## Examples

```vue
<u-number :value="12345" format="currency" />
```

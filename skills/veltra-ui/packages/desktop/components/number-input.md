# UNumberInput — 数字输入框

> `import type { NumberInputProps, NumberInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UNumberInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `number` | — | 绑定值
| `currency` | `boolean` | — | 是否金额模式
| `precision` | `number` | — | 精度
| `minPrecision` | `number` | — | 最小精度
| `maxPrecision` | `number` | — | 最大精度
| `step` | `boolean \| number` | — | 步进值
| `max` | `number` | — | 最大值
| `min` | `number` | — | 最小值
| `multiple` | `number` | — | 步进倍数

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value?: number)` — 值变化
| `change` | `(value?: number)` — 值确认

## Examples

```vue
<u-number-input v-model="num" :min="0" :max="100" />
```

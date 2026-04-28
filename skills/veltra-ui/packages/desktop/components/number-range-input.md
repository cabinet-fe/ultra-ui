# UNumberRangeInput — 数字范围输入框

> `import type { NumberRangeInputProps, NumberRangeInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UNumberRangeInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `[number \| undefined, number \| undefined]` | — | 绑定值
| `start` | `number` | — | 起始值
| `end` | `number` | — | 结束值
| `startPlaceholder` | `string` | — | 起始占位文本
| `endPlaceholder` | `string` | — | 结束占位文本
| `separator` | `string` | — | 分隔符

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: [number \| undefined, number \| undefined])` — 值变化
| `update:start` | `(value)` — 起始值变化
| `update:end` | `(value)` — 结束值变化
| `change` | `(value)` — 值确认

## Examples

```vue
<u-number-range-input v-model="range" />
```

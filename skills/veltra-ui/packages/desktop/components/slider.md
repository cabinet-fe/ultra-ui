# USlider — 滑块

> `import type { SliderProps, SliderEmits } from '@veltra/desktop'`

## Import

```ts
import { USlider } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `number \| [number, number]` | — | 当前值
| `min` | `number` | `0` | 最小值
| `max` | `number` | `100` | 最大值
| `step` | `number` | — | 步长
| `range` | `boolean` | `false` | 是否为范围选择
| `vertical` | `boolean` | `false` | 是否垂直显示

继承 `FormComponentProps`。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value)` — 值变化时触发

## Examples

```vue
<u-slider v-model="value" :min="0" :max="100" />
<u-slider v-model="range" range />
```

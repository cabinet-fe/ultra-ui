# USteps — 步骤条

> `import type { StepsProps, StepsEmits } from '@veltra/desktop'`

## Import

```ts
import { USteps } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `current` | `string \| number` | — | 当前步骤值
| `size` | `ComponentSize` | — | 尺寸
| `items` | `Record<string, any>[]` | — | 步骤列表
| `labelKey` | `string` | — | 标签字段
| `currentKey` | `string` | — | 当前值字段
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向
| `alignCenter` | `boolean` | — | 是否居中
| `currentStepType` | `ColorType` | — | 当前步骤颜色
| `finishedStepType` | `ColorType` | `'success'` | 已完成步骤颜色

## Emits

| event | 参数
|-------|------
| `update:current` | `(value)` — 当前步骤变化时触发
| `item-click` | `(item, index)` — 点击步骤时触发

## Examples

```vue
<u-steps v-model:current="current" :items="steps" />
```

# UProgressNodes — 节点进度

> `import type { ProgressNodesProps, ProgressNodesEmits } from '@veltra/desktop'`

## Import

```ts
import { UProgressNodes } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string \| number` | — | 当前选中值
| `nodes` | `Record<string, any>[]` | — | 节点列表
| `check` | `Function` | — | 节点是否可点击的判断函数
| `colorType` | `ColorType` | — | 节点颜色类型
| `maxWidth` | `number \| string` | — | 最大宽度
| `labelKey` | `string` | `'label'` | 节点标签字段
| `valueKey` | `string` | `'value'` | 节点值字段

## Emits

| event | 参数
|-------|------
| `click` | `(node, index)` — 点击节点时触发
| `update:modelValue` | `(value)` — 选中值变化时触发

## Examples

```vue
<u-progress-nodes v-model="current" :nodes="steps" />
```

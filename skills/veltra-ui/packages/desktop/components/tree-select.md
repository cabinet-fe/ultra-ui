# UTreeSelect — 树选择

> `import type { TreeSelectProps, TreeSelectEmits } from '@veltra/desktop'`

## Import

```ts
import { UTreeSelect } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string \| number` | — | 当前选中值
| `placeholder` | `string` | — | 占位文本
| `clearable` | `boolean` | — | 是否可清空
| `filterable` | `boolean` | — | 是否可搜索
| `minWidth` | `string` | `'280px'` | 最小宽度
| `width` | `string` | — | 宽度
| `contentStyle` | — | — | 下拉内容样式
| `contentClass` | — | — | 下拉内容类名

继承 `FormComponentProps` 及 `TreeProps`（排除部分字段）。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value)` — 选中值变化时触发
| `change` | `(node: Record<string, any>)` — 选中节点变化时触发

## Examples

```vue
<u-tree-select v-model="selected" :data="treeData" />
```

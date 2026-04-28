# UMultiTreeSelect — 多选树选择器

> `import type { MultiTreeSelectProps, MultiTreeSelectEmits } from '@veltra/desktop'`

## Import

```ts
import { UMultiTreeSelect } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `(string \| number)[]` | — | 选中值
| `placeholder` | `string` | — | 占位文本
| `clearable` | `boolean` | — | 是否可清除
| `filterable` | `boolean` | — | 是否可搜索
| `visibilityLimit` | `number` | `3` | 标签显示数量上限
| `minWidth` | `string` | `'280px'` | 最小宽度
| `width` | `string` | — | 宽度
| `contentStyle` | — | — | 下拉内容样式
| `contentClass` | — | — | 下拉内容类名

## Emits

| event | 参数
|-------|------
| `clear` | — 清除事件
| `update:modelValue` | `(value: any[])` — 选中值变化
| `change` | `(checked: Record<string, any>[])` — 选中节点变化

## Examples

```vue
<u-multi-tree-select v-model="selected" :data="treeData" />
```

# UMultiSelect — 多项选择器

> `import type { MultiSelectProps, MultiSelectEmits } from '@veltra/desktop'`

## Import

```ts
import { UMultiSelect } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `any[]` | — | 选中值
| `options` | `Record<string, any>[] \| Function` | — | 选项列表或函数
| `valueKey` | `string` | — | 值字段
| `labelKey` | `string` | — | 标签字段
| `clearable` | `boolean` | — | 是否可清除
| `placeholder` | `string` | — | 占位文本
| `filterable` | `boolean` | — | 是否可搜索
| `visibilityLimit` | `number` | — | 标签显示数量上限
| `max` | `number` | — | 最大可选数量
| `contentStyle` | — | — | 下拉内容样式
| `contentClass` | — | — | 下拉内容类名
| `minWidth` | `string` | — | 最小宽度
| `width` | `string` | `'220px'` | 宽度
| `creatable` | `boolean` | — | 是否允许新建

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: any[])` — 选中值变化
| `change` | `(options: Record<string, any>[])` — 选项变化

## Examples

```vue
<u-multi-select v-model="selected" :options="list" />
```

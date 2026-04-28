# UGroupInput — 分组输入

> `import type { GroupInputProps, GroupInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UGroupInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `GroupItem[]` | — | 分组数据
| `max` | `number` | — | 最大条目数
| `creatable` | `boolean` | — | 是否允许新建
| `itemDefault` | `Record<string, any>` | — | 新建条目的默认值
| `itemStyle` | `StyleValue` | — | 条目样式

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(modelValue: GroupItem[])` — 数据变化

## Examples

```vue
<u-group-input v-model="items" />
```

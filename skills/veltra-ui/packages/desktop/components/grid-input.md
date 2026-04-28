# UGridInput — 网格输入

> `import type { GridInputProps, GridInputEmits } from '@veltra/desktop'`

## Import

```ts
import { UGridInput } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 输入值
| `length` | `number` | — | 格子数量
| `zero` | `false` | — | 是否允许零值
| `separator` | `string` | — | 分隔符

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 值变化
| `input` | `(value: string)` — 输入中

## Exposed

```ts
interface GridInputExposed {
  clear: () => void
}
```

## Examples

```vue
<u-grid-input v-model="code" :length="6" />
```

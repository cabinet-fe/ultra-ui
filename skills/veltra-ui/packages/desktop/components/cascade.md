# UCascade — 级联选择器

> `import type { CascadeProps, CascadeEmits } from '@veltra/desktop'`

## Import

```ts
import { UCascade } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `separator` | `string` | `'/'` |
| `modelValue` | `string[] \| string` | — |
| `labelKey` | `string` | — |
| `valueKey` | `string` | — |
| `placeholder` | `string` | — |
| `clearable` | `boolean` | — |
| `childrenKey` | `string` | — |
| `strict` | `boolean` | — |
| `data` | `Record<string, any>[]` | — |
| `disabledNode` | `Function` | — |
| `multiple` | `boolean` | — |
| `filterable` | `boolean` | — |
| `visibilityLimit` | `number` | — |

另有继承自 `FormComponentProps` 的属性。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value?)` |
| `change` | `(...)` |
| `clear` | — |

## Exposed

无暴露属性。

## Examples

```vue
<u-cascade v-model="value" :data="options" />
```

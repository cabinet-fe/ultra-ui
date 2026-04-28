# UAutoComplete — 自动完成

> `import type { AutoCompleteProps, AutoCompleteEmits } from '@veltra/desktop'`

## Import

```ts
import { UAutoComplete } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |
| `placeholder` | `string` | — |
| `suggestions` | `string[] \| (() => Promise<string[]> \| string[])` | — |
| `clearable` | `boolean` | — |

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` |
| `select` | `(value: string)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-auto-complete v-model="query" :suggestions="options" />
```

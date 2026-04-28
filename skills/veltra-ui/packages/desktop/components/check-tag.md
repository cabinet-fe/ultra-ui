# UCheckTag — 勾选标签

> `import type { CheckTagProps, CheckTagEmits } from '@veltra/desktop'`

## Import

```ts
import { UCheckTag } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |
| `checked` | `boolean` | — |

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: boolean)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-check-tag v-model="checked">标签</u-check-tag>
```

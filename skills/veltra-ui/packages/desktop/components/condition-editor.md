# UConditionEditor — 条件编辑器

> `import type { ConditionEditorProps, ConditionEditorEmits } from '@veltra/desktop'`

## Import

```ts
import { UConditionEditor } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-condition-editor v-model="conditions" />
```

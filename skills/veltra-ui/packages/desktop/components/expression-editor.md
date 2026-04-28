# UExpressionEditor — 表达式编辑器

> `import type { ExpressionEditorProps, ExpressionEditorEmits } from '@veltra/desktop'`

## Import

```ts
import { UExpressionEditor } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |
| `placeholder` | `string` | — |
| `variables` | `VariableItem[]` | — |

### VariableItem

| prop | type | 说明
|------|------|------
| `label` | `string` | |
| `value` | `string` | |
| `type` | `string` | 可选 |
| `children` | `VariableItem[]` | 可选 |

另有继承自 `FormComponentProps` 的属性。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-expression-editor v-model="expr" :variables="vars" />
```

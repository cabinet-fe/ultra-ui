# UCodeEditor — 代码编辑器

> `import type { CodeEditorProps, CodeEditorEmits } from '@veltra/desktop'`

## Import

```ts
import { UCodeEditor } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — |
| `language` | `'js' \| 'sql' \| 'java' \| 'json'` | — |

另有继承自 `FormComponentProps` 的属性。

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` |

## Exposed

无暴露属性。

## Examples

```vue
<u-code-editor v-model="code" language="js" />
```

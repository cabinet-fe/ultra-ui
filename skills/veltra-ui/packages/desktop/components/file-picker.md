# UFilePicker — 文件选择器

> `import type { FilePickerProps, FilePickerEmits } from '@veltra/desktop'`

## Import

```ts
import { UFilePicker } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `tag` | `string` | — |
| `accept` | `string` | — |
| `multiple` | `boolean` | — |

另有继承自 `FormComponentProps` 的属性。

## Emits

| event | 参数
|-------|------
| `pick` | `(files: File[])` |

## Exposed

无暴露属性。

## Examples

```vue
<u-file-picker accept="image/*" @pick="onPick" />
```

# URichTextEditor — 富文本编辑器

> `import type { RichTextEditorProps, RichTextEditorEmits } from '@veltra/desktop'`

## Import

```ts
import { URichTextEditor } from '@veltra/desktop'
```

## Props

| prop | type | default | 说明
|------|------|---------|------
| `modelValue` | `string` | — | 编辑器内容
| `format` | `'html' \| 'json'` | `'html'` | 输出格式
| `toolbar` | `ToolbarItem[]` | — | 工具栏配置项
| `placeholder` | `string` | — | 占位文本

继承 `FormComponentProps`。

`ToolbarItem` 可选值：`'bold' \| 'italic' \| 'underline' \| 'strikethrough' \| 'code' \| 'heading' \| 'bullet-list' \| 'ordered-list' \| 'blockquote' \| 'code-block' \| 'link' \| 'undo' \| 'redo' \| '\|'`

## Emits

| event | 参数
|-------|------
| `update:modelValue` | `(value: string)` — 内容变化时触发

## Examples

```vue
<u-rich-text-editor v-model="content" />
```

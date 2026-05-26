# URichTextEditor — 富文本编辑器

> `import type { RichTextEditorProps, RichTextEditorEmits, ToolbarItem } from '@veltra/desktop'`

基于 Lexical 的富文本编辑器，支持 HTML 和 JSON 两种数据格式，内置工具栏，继承表单上下文。

## Import

```ts
// URichTextEditor 由 Vite 自动导入，无需手动 import
```

## Props

| prop          | type                                 | default     | 说明                  |
| ------------- | ------------------------------------ | ----------- | --------------------- |
| `modelValue`  | `string`                             | —           | 编辑器内容（v-model） |
| `format`      | `'html' \| 'json'`                   | `'html'`    | 数据输出格式          |
| `toolbar`     | `ToolbarItem[]`                      | 默认工具栏  | 工具栏配置项          |
| `placeholder` | `string`                             | `''`        | 占位文本              |
| `disabled`    | `boolean`                            | `false`     | 是否禁用              |
| `readonly`    | `boolean`                            | `false`     | 是否只读              |
| `size`        | `'small' \| 'default' \| 'large'`    | `'default'` | 组件尺寸              |
| `label`       | `string`                             | —           | 表单标签文字          |
| `field`       | `string`                             | —           | 表单项字段            |
| `tips`        | `string`                             | —           | 表单控件内提示文字    |
| `span`        | `number \| 'full' \| BreakpointSpan` | —           | 所占列的大小          |

> `size`、`disabled`、`readonly` 可从父级表单上下文注入，`label`、`field`、`tips`、`span` 由表单布局组件消费。

**ToolbarItem**

```ts
type ToolbarItem =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'code'
  | 'heading'
  | 'bullet-list'
  | 'ordered-list'
  | 'blockquote'
  | 'code-block'
  | 'link'
  | 'undo'
  | 'redo'
  | '|' // 分隔符
```

**默认工具栏**

```ts
;[
  'undo',
  'redo',
  '|',
  'heading',
  '|',
  'bold',
  'italic',
  'underline',
  'strikethrough',
  '|',
  'bullet-list',
  'ordered-list',
  '|',
  'blockquote',
  '|',
  'link'
]
```

## Emits

| event               | 参数              | 说明           |
| ------------------- | ----------------- | -------------- |
| `update:modelValue` | `(value: string)` | 内容变化时触发 |

## Slots

无插槽。

## Exposed

```ts
interface RichTextEditorExposed {}
```

## Examples

**基础用法**

```vue
<template>
  <u-rich-text-editor v-model="content" placeholder="请输入内容..." />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const content = ref('<p>Hello World</p>')
</script>
```

**JSON 格式输出**

```vue
<template>
  <u-rich-text-editor v-model="jsonContent" format="json" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const jsonContent = ref('')

watch(jsonContent, (val) => {
  console.log('Lexical JSON:', JSON.parse(val))
})
</script>
```

**自定义工具栏**

```vue
<template>
  <u-rich-text-editor v-model="content" :toolbar="['bold', 'italic', 'underline', '|', 'link']" />
</template>

<script setup lang="ts">
import { ref } from 'vue'

const content = ref('')
</script>
```

**禁用 / 只读**

```vue
<template>
  <div>
    <u-rich-text-editor v-model="content" disabled />
    <u-rich-text-editor v-model="content" readonly />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const content = ref('<p>不可编辑的内容</p>')
</script>
```

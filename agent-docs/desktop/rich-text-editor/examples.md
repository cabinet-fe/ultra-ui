---
title: URichTextEditor 富文本编辑器示例
description: 用 v-model 绑定 HTML 或 JSON；表单内用 field
---

`URichTextEditor` 的 `format` 为 `'html'`（默认语义）或 `'json'`。`toolbar` 为工具栏项数组，项可以是 `'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'heading' | 'bullet-list' | 'ordered-list' | 'blockquote' | 'code-block' | 'link' | 'undo' | 'redo' | '|'`。独立使用 `v-model`；在 `UForm` 内写 `field`，不要并用 `v-model`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const html = shallowRef('<p>Hello</p>')
</script>

<template>
  <u-rich-text-editor
    v-model="html"
    format="html"
    placeholder="请输入内容"
    :toolbar="['bold', 'italic', '|', 'bullet-list', 'link']"
  />
</template>
```

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({ content: '' })
</script>

<template>
  <u-form :model="form">
    <u-rich-text-editor label="正文" field="content" placeholder="请输入富文本" />
  </u-form>
</template>
```

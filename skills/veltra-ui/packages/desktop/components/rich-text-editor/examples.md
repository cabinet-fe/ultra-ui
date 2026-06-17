# URichTextEditor 示例

## 基础用法

```vue
<script setup lang="ts">
import { ref } from 'vue'

const content = ref('<p>Hello</p>')
</script>

<template>
  <u-rich-text-editor v-model="content" placeholder="请输入内容" />
</template>
```

## 在 UForm 中使用

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const formData = reactive({ content: '' })
</script>

<template>
  <u-form :model="formData">
    <u-rich-text-editor label="内容" field="content" placeholder="请输入富文本内容" />
  </u-form>
</template>
```

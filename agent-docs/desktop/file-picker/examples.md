---
title: UFilePicker 文件选择器示例
description: 点击或拖拽拾取文件，通过 pick 事件拿到 File 列表
---

`UFilePicker` 点击或拖入文件后触发 `pick`，参数为通过 `accept` 过滤后的 `File[]`。`multiple` 允许多选。默认插槽可拿到 `{ isDragover }`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'

const files = shallowRef<File[]>([])
</script>

<template>
  <u-file-picker accept="image/*" multiple @pick="files = [...files, ...$event]">
    <u-button>选择图片</u-button>
  </u-file-picker>

  <u-file-picker v-slot="{ isDragover }" @pick="files = [...files, ...$event]">
    <div>{{ isDragover ? '松开以上传' : '拖到此处或点击选择' }}</div>
  </u-file-picker>
</template>
```

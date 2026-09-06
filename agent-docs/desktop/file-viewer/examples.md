---
title: UFileViewer 文件查看器示例
description: 传入 files 预览图片、视频、PDF、表格、Word 与文本；open 控制全屏模态
---

`UFileViewer` 的 `files` 必填，每项含 `name` 与 `src`（URL、`File` / `Blob` / `ArrayBuffer` / `Uint8Array`）。`kind` 缺省按文件名后缀推断：`'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'`。`v-model` 是当前文件 `id`。`v-model:open` 有值时进入全屏模态（Teleport 到 body）。Excel/CSV 预览需要可选 peer `@veltra/sheet-core`。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import type { FileViewerItem } from '@veltra/desktop'

const open = shallowRef(false)
const active = shallowRef<string>()
const files: FileViewerItem[] = [
  {
    id: 'readme',
    name: 'readme.txt',
    src: 'data:text/plain;charset=utf-8,' + encodeURIComponent('预览文本'),
    kind: 'text'
  }
]
</script>

<template>
  <u-button type="primary" @click="open = true">打开预览</u-button>
  <u-file-viewer v-model="active" v-model:open="open" :files="files" />
</template>
```

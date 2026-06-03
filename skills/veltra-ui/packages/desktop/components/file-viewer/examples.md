# UFileViewer 示例

## 基础内嵌预览

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { FileViewerItem } from '@veltra/desktop'

const files = ref<FileViewerItem[]>([
  { name: 'report.pdf', src: '/files/report.pdf', size: 204800 },
  { name: 'screenshot.png', src: '/files/screenshot.png' },
  { name: 'data.xlsx', src: '/files/data.xlsx', size: 10240 }
])
</script>

<template>
  <u-file-viewer v-model="activeId" :files="files" :sidebar-width="240" />
</template>
```

## 全屏模态

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const files = ref([{ name: 'photo.jpg', src: '/photos/photo.jpg', size: 512000 }])
</script>

<template>
  <u-button @click="open = true">预览图片</u-button>

  <u-file-viewer v-model:open="open" :files="files" :downloadable="false" />
</template>
```

## 二进制数据预览

```vue
<script setup lang="ts">
import { ref } from 'vue'

const files = ref([
  {
    name: 'uploaded.csv',
    src: new Blob(['a,b,c\n1,2,3'], { type: 'text/csv' }),
    kind: 'sheet' as const,
    size: 15
  }
])
</script>

<template>
  <u-file-viewer :files="files" :sidebar-width="false" :sheet-max-rows="0" />
</template>
```

## 监听切换与错误

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { FileViewerItem } from '@veltra/desktop'

const activeId = ref<string>()
const files = ref<FileViewerItem[]>([
  { name: 'doc.docx', src: '/docs/doc.docx' },
  { name: 'broken.pdf', src: '/files/not-found.pdf' }
])

function onChange(file: FileViewerItem) {
  console.log('切换到:', file.name)
}

function onError({ file, error }: { file: FileViewerItem; error: unknown }) {
  console.error('预览失败:', file.name, error)
}
</script>

<template>
  <u-file-viewer v-model="activeId" :files="files" @change="onChange" @error="onError" />
</template>
```

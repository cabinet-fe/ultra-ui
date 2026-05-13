# UFileViewer — 文件查看器

> `import type { FileViewerProps, FileViewerEmits, FileViewerExposed, FileViewerItem, FileViewerKind } from '@veltra/desktop'`

支持预览 image、video、pdf、sheet（xlsx/csv）、docx、text 六类文件。内置侧栏文件列表、缩放拖拽、分页切换、下载功能，支持内嵌和全屏模态两种模式。

## Import

```ts
// UFileViewer 由 Vite 自动导入，无需手动 import
```

### FileViewerItem

```ts
interface FileViewerItem {
  /** 唯一 id；未提供时组件内部按索引生成 */
  id?: string
  /** 展示名（通常为原始文件名） */
  name: string
  /**
   * 文件源：
   * - string: URL（支持 http(s):、blob:、data:）
   * - File / Blob / ArrayBuffer / Uint8Array: 二进制原始数据
   */
  src: string | File | Blob | ArrayBuffer | Uint8Array
  /** 类型；缺省时根据 name 后缀推断 */
  kind?: FileViewerKind
  /** MIME type，仅用于原生 <video> / <img> / 下载时的类型提示 */
  mime?: string
  /** 文件大小（字节），可选，仅用于侧栏展示 */
  size?: number
}

type FileViewerKind = 'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'
```

> **类型推断规则**：`kind` 缺省时根据 `name` 后缀自动推断 — `png/jpg/gif/webp/...` → image、`mp4/webm/mov/...` → video、`pdf` → pdf、`xlsx/csv/...` → sheet、`docx` → docx、`txt/md/json/ts/...` → text。

## Props

| prop | type | default | 说明 |
|------|------|---------|------|
| `files` | `FileViewerItem[]` | — | 待预览的文件列表 |
| `modelValue` | `string` | — | 当前激活文件 id，支持 `v-model` |
| `sidebarWidth` | `string \| number \| false` | `'280px'` | 侧栏宽度。`false` 或 `0` 隐藏侧栏 |
| `sheetMaxRows` | `number` | `50000` | sheet 单文件最大渲染行数；`0` 不截断 |
| `downloadable` | `boolean` | `true` | 是否显示下载按钮 |
| `open` | `boolean` | — | 全屏模态开关，支持 `v-model:open`。缺省为内嵌模式；显式传入后组件 Teleport 到 body 并以模态呈现 |
| `closeOnClickBackdrop` | `boolean` | `true` | 模态模式下点击背景是否关闭 |
| `closeOnEsc` | `boolean` | `true` | 模态模式下按 ESC 是否关闭 |

## Emits

| event | 参数 | 说明 |
|-------|------|------|
| `update:modelValue` | `(id: string)` | 当前激活文件 id 变更 |
| `update:open` | `(value: boolean)` | 模态显隐变更 |
| `change` | `(file: FileViewerItem)` | 切换文件时触发 |
| `error` | `(err: { file: FileViewerItem; error: unknown })` | 预览或下载发生错误时触发 |

## Slots

无。

## Exposed

```ts
interface FileViewerExposed {
  /** 当前激活文件 id */
  activeId: ShallowRef<string | undefined>
  /** 激活指定文件 */
  activate: (id: string) => void
  /** 切换到下一个文件 */
  next: () => void
  /** 切换到上一个文件 */
  prev: () => void
}
```

## Examples

### 基础内嵌预览

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

### 全屏模态

```vue
<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
const files = ref([
  { name: 'photo.jpg', src: '/photos/photo.jpg', size: 512000 }
])
</script>

<template>
  <u-button @click="open = true">预览图片</u-button>

  <u-file-viewer
    v-model:open="open"
    :files="files"
    :downloadable="false"
  />
</template>
```

### 二进制数据预览

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

### 监听切换与错误

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
  <u-file-viewer
    v-model="activeId"
    :files="files"
    @change="onChange"
    @error="onError"
  />
</template>
```

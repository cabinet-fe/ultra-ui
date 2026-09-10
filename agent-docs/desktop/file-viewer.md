---
title: UFileViewer 文件查看器
description: 多格式文件预览面板：传入 files 即可预览图片、视频、PDF、Excel/CSV、Word 与文本，带文件侧栏、缩放/平移、下载按钮；open 传入布尔值切换为 Teleport 到 body 的全屏模态。
aliases: [FileViewer, file-viewer, 文件预览, 预览器, 文件查看]
keywords: [files, modelValue, open, sidebarWidth, sheetMaxRows, downloadable, closeOnEsc, closeOnClickBackdrop, activate, activeId, FileViewerItem, FileViewerKind, sheet-core, xlsx 预览, csv 预览, 图片预览, PDF 预览, 视频预览, 文本预览, 全屏模态]
---

# UFileViewer 文件查看器

`@veltra/desktop` 导出的文件预览组件 `UFileViewer`：传入 `FileViewerItem[]` 即可在一个面板内预览图片、视频、PDF、表格（xlsx/xlsm/xlsb/csv）、Word（docx）与文本文件；左侧文件列表切换、工具栏缩放/翻页/下载；`open` 传入布尔值时进入 Teleport 到 body 的全屏模态模式。

## 快速上手

```vue
<script setup lang="ts">
import { UFileViewer } from '@veltra/desktop'
import type { FileViewerItem } from '@veltra/desktop'
import { ref } from 'vue'

// 需替换为可访问的文件地址；kind 缺省时按 name 后缀推断
const files: FileViewerItem[] = [
  { id: 'pdf', name: 'report.pdf', src: '/files/report.pdf', size: 204800 },
  { id: 'img', name: 'cover.png', src: '/files/cover.png' }
]

const active = ref<string>('pdf')
</script>

<template>
  <UFileViewer v-model="active" :files="files" style="height: 480px" />
</template>
```

内嵌模式必须给组件一个高度（`style="height: 480px"` 或父级布局约束），否则预览区塌陷为 0。

## API 签名

```ts
import type { ShallowRef } from 'vue'

/** 预览器类别：xlsx 与 csv 归一为 sheet */
export type FileViewerKind = 'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'

/** 单个预览文件定义 */
export interface FileViewerItem {
  /** 唯一 id；未提供时组件内部按索引生成 `file-0`、`file-1`… */
  id?: string
  /** 展示名（原始文件名），kind 缺省时按它的后缀推断 */
  name: string
  /** 文件源：string 为 URL（支持 http(s):、blob:、data:）；其余为二进制原始数据 */
  src: string | File | Blob | ArrayBuffer | Uint8Array
  /** 类型；缺省时根据 name 后缀推断 */
  kind?: FileViewerKind
  /** MIME type，仅用于原生 <video> / <img> / 下载时的类型提示 */
  mime?: string
  /** 文件大小（字节），可选，仅用于侧栏与头部展示 */
  size?: number
}

/** 文件预览组件属性 */
export interface FileViewerProps {
  /** 待预览的文件列表。必填 */
  files: FileViewerItem[]
  /** 当前激活文件 id（配合 v-model） */
  modelValue?: string
  /** 侧栏宽度（CSS length 或 false 隐藏侧栏）。默认 '280px' */
  sidebarWidth?: string | number | false
  /** sheet 场景单文件最大渲染行数，仅驱动「超出上限」提示，不裁剪数据。默认 50000；0 表示不提示 */
  sheetMaxRows?: number
  /** 是否显示下载按钮。默认 true */
  downloadable?: boolean
  /**
   * 全屏模态模式开关（支持 v-model:open）。
   * - undefined（缺省）：内嵌模式，组件在原位置渲染
   * - true / false：模态模式，Teleport 到 body，按本值控制显隐
   */
  open?: boolean
  /** 模态模式下按下鼠标左键点击背景是否关闭。默认 true */
  closeOnClickBackdrop?: boolean
  /** 模态模式下按 ESC 是否关闭。默认 true */
  closeOnEsc?: boolean
}

/** 文件预览组件事件 */
export interface FileViewerEmits {
  (e: 'update:modelValue', id: string): void
  (e: 'update:open', value: boolean): void
  /** 激活文件切换后触发 */
  (e: 'change', file: FileViewerItem): void
  /** 某个文件预览或下载失败时触发 */
  (e: 'error', err: { file: FileViewerItem; error: unknown }): void
}

/** 暴露成员经自动解构后可直接从模板 ref 访问 */
export interface FileViewerExposed {
  /** 当前激活文件 id（响应式引用，.value 取值） */
  activeId: ShallowRef<string | undefined>
  /** 切换到指定 id 的文件；id 不存在时无效果 */
  activate: (id: string) => void
  /** 切换到下一个文件；已是最后一个时无效果 */
  next: () => void
  /** 切换到上一个文件；已是第一个时无效果 */
  prev: () => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `files` | `FileViewerItem[]` | `—` | 是 | 列表为空时显示「暂无文件」空态；`modelValue` 未设或失效时自动激活第一个文件 |
| `modelValue` | `string` | `undefined` | 否 | 必须是 `files` 中某项的 `id`；`files` 变化后失效的 id 会被重置为第一个文件 |
| `sidebarWidth` | `string \| number \| false` | `'280px'` | 否 | `number` 按 px 处理；`false` 或 `0` 隐藏侧栏 |
| `sheetMaxRows` | `number` | `50000` | 否 | 仅对 `sheet` 类别生效；行数超出时显示提示条，数据不裁剪；`0` 关闭提示 |
| `downloadable` | `boolean` | `true` | 否 | 控制工具栏下载按钮显隐 |
| `open` | `boolean` | `undefined` | 否 | 只要显式传入（含 `v-model:open`）即进入模态模式；模态打开期间锁定 body 滚动 |
| `closeOnClickBackdrop` | `boolean` | `true` | 否 | 仅模态模式生效 |
| `closeOnEsc` | `boolean` | `true` | 否 | 仅模态模式生效 |

`kind` 后缀推断规则（`kind` 显式传入时以传入值为准）：

| kind | 后缀 |
| --- | --- |
| `image` | `png` `jpg` `jpeg` `gif` `webp` `bmp` `svg` `avif` `ico` |
| `video` | `mp4` `webm` `mov` `m4v` `ogv` `mkv` |
| `pdf` | `pdf` |
| `sheet` | `xlsx` `xlsm` `xlsb` `csv` |
| `docx` | `docx` |
| `text` | `txt` `log` `md` `markdown` `json` `yml` `yaml` `xml` `js` `ts` `tsx` `jsx` `css` `scss` `sass` `less` `html` `htm` `ini` `toml` `sh` `bash` `zsh` `env` `sql`；其余未知后缀也归入 `text` |

## 方法与事件

### 事件

| 事件 | payload | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `id: string` | 激活文件变化（点侧栏、调 `activate`/`next`/`prev`、内部自动激活） |
| `update:open` | `value: boolean` | 模态模式下点背景、按 ESC、点关闭按钮时变为 `false` |
| `change` | `file: FileViewerItem` | 激活文件切换且 id 与之前不同 |
| `error` | `{ file: FileViewerItem; error: unknown }` | URL fetch 失败（`Fetch failed: <status> <statusText>`）、sheet-core 缺失、文本/表格解析失败、下载失败等 |

### 暴露成员（模板 ref，已解构）

| 成员 | 签名 | 说明 |
| --- | --- | --- |
| `activeId` | `ShallowRef<string \| undefined>` | 当前激活 id，响应式 |
| `activate` | `(id: string) => void` | 同步；切到指定文件并触发 `change` |
| `next` / `prev` | `() => void` | 同步；越界时无效果 |

### 工具栏缩放行为（内置，不可配置）

- `image`：工具栏缩放按钮 + Ctrl/⌘+滚轮缩放（步进 0.1，范围 0.5~3），缩放大于 1 后可拖拽平移，双击在 100% 与 200% 间切换
- `pdf`：缩放由 @embedpdf 的 zoom 插件处理，工具栏同样显示百分比
- 其余类别不显示缩放控件

## 典型示例

### 全屏模态预览 + 切换与错误监听

```vue
<script setup lang="ts">
import { UButton, UFileViewer } from '@veltra/desktop'
import type { FileViewerItem } from '@veltra/desktop'
import { ref } from 'vue'

const open = ref(false)
const active = ref<string>()

const files: FileViewerItem[] = [
  { id: 'doc', name: 'doc.docx', src: '/docs/doc.docx' },
  { id: 'broken', name: 'broken.pdf', src: '/files/not-found.pdf' }
]

function onChange(file: FileViewerItem) {
  console.log('切换到:', file.name) // => 切换到: doc.docx
}

function onError(err: { file: FileViewerItem; error: unknown }) {
  console.error('预览失败:', err.file.name, err.error)
}
</script>

<template>
  <UButton type="primary" @click="open = true">打开预览</UButton>
  <UFileViewer v-model="active" v-model:open="open" :files="files" @change="onChange" @error="onError" />
</template>
```

### 预览本地拾取的二进制文件（File / Blob）

```vue
<script setup lang="ts">
import { UButton, UFilePicker, UFileViewer } from '@veltra/desktop'
import type { FileViewerItem } from '@veltra/desktop'
import { ref } from 'vue'

const open = ref(false)
const files = ref<FileViewerItem[]>([])

function onPick(picked: File[]) {
  files.value = picked.map((f, i) => ({
    id: `local-${Date.now()}-${i}`,
    name: f.name,
    src: f, // File 直接作为源，图片/表格/文本按后缀分发
    size: f.size,
    mime: f.type
  }))
  open.value = true
}
</script>

<template>
  <UFilePicker multiple @pick="onPick">
    <UButton>选择文件并预览</UButton>
  </UFilePicker>

  <UFileViewer v-model:open="open" :files="files" :downloadable="false" />
</template>
```

### CSV 内容预览与隐藏侧栏

```vue
<script setup lang="ts">
import { UFileViewer } from '@veltra/desktop'
import type { FileViewerItem } from '@veltra/desktop'

const files: FileViewerItem[] = [
  {
    name: 'sales.csv',
    src: new Blob(['Region,Revenue\nNorth,128340\nSouth,98450'], { type: 'text/csv' }),
    kind: 'sheet',
    size: 34
  }
]
</script>

<template>
  <!-- sidebar-width false 隐藏侧栏；sheet-max-rows 0 关闭行数上限提示 -->
  <UFileViewer :files="files" :sidebar-width="false" :sheet-max-rows="0" style="height: 360px" />
</template>
```

## 注意事项

> [!WARNING]
> - Excel/CSV 预览依赖可选 peer `@veltra/sheet-core`：已安装时以只读 `SheetGrid` 渲染（xlsx 多 sheet 显示页签，csv 单表、表名取文件名）；未安装时该类文件显示「无法预览表格：未安装 @veltra/sheet-core」空态，并向 `error` 事件抛出 `Error('未安装 @veltra/sheet-core，无法预览 Excel/CSV')`，其余格式不受影响。安装：`pnpm add @veltra/sheet-core`。
> - `sheetMaxRows` 只驱动「超出预览上限」提示条，不裁剪也不截断数据；超大表格仍会全量加载，控制加载成本应在源头限制文件。
> - PDF 预览由内置依赖 `@embedpdf/*` 渲染，Word 由 `docx-preview` 渲染，均为必装依赖，无需额外安装。
> - 文本预览最多读取前 2MB（超出显示「文件过大，仅展示前 …」提示），按 UTF-8 解码。
> - 二进制源（`File`/`Blob`/`ArrayBuffer`/`Uint8Array`）内部会创建 ObjectURL 并在切换/卸载时回收；`Uint8Array` 会被复制，外部后续修改不影响预览。
> - 内嵌模式必须给组件高度；模态模式（传 `open`）不必。
> - 双向绑定是 `v-model`（激活文件 id）与 `v-model:open`（模态开关）两个，别把 `open` 当成 `v-model` 本体。

## 常见问题

### 表格文件显示「无法预览表格：未安装 @veltra/sheet-core」

原因：宿主工程未安装可选 peer `@veltra/sheet-core`。修复：

```bash
pnpm add @veltra/sheet-core
```

### 预览 URL 文件时 `error` 事件收到 `Fetch failed: 404 Not Found`

原因：`src` 指向的 URL 不可访问。组件对 string 源统一走 `fetch`，非 2xx 即抛此错误。修复：确认 URL 可用，或在 `@error` 里对失败文件降级（如提示下载）。

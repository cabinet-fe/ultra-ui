---
title: "UFileViewer - 文件查看器"
description: "传入 files 预览图片、视频、PDF、表格、Word 与文本；open 控制全屏模态"
keywords:
  - UFileViewer
  - @veltra/desktop
  - file-viewer
  - FileViewer
  - 文件查看器
aliases: ["file-viewer", "UFileViewer", "FileViewer", "文件查看器"]
---
## 快速上手

```ts
import { UFileViewer } from '@veltra/desktop'
```

## 典型示例

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

## API 签名 / 类型定义

```ts
export type DeconstructValue<E extends Record<string, any>> = {
  [K in keyof E]: E[K] extends { value: infer V } ? V : E[K]
}

import type { ShallowRef } from 'vue'

/** 预览器类别：xlsx 与 csv 归一为 sheet */
export type FileViewerKind = 'image' | 'video' | 'pdf' | 'sheet' | 'docx' | 'text'

/** 单个预览文件定义 */
export interface FileViewerItem {
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

/** 文件预览组件属性 */
export interface FileViewerProps {
  /** 待预览的文件列表 */
  files: FileViewerItem[]
  /** 当前激活文件 id（配合 v-model） */
  modelValue?: string
  /** 侧栏宽度（CSS length 或 false 隐藏侧栏），默认 280px */
  sidebarWidth?: string | number | false
  /** sheet 场景单文件最大渲染行数，默认 50000；0 表示不截断 */
  sheetMaxRows?: number
  /** 是否显示下载按钮，默认 true */
  downloadable?: boolean
  /**
   * 全屏模态模式开关（支持 v-model:open）。
   *
   * - `undefined`（缺省）：内嵌模式，组件在原位置渲染
   * - `true` / `false`：进入模态模式，Teleport 到 body，按本值控制显隐
   */
  open?: boolean
  /** 模态模式下点击背景是否关闭，默认 true */
  closeOnClickBackdrop?: boolean
  /** 模态模式下按 ESC 是否关闭，默认 true */
  closeOnEsc?: boolean
}

/** 文件预览组件事件 */
export interface FileViewerEmits {
  (e: 'update:modelValue', id: string): void
  (e: 'update:open', value: boolean): void
  (e: 'change', file: FileViewerItem): void
  (e: 'error', err: { file: FileViewerItem; error: unknown }): void
}

/** 文件预览组件暴露的属性和方法(组件内部使用) */
export interface _FileViewerExposed {
  activeId: ShallowRef<string | undefined>
  activate: (id: string) => void
  next: () => void
  prev: () => void
}

/** 文件预览组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FileViewerExposed = DeconstructValue<_FileViewerExposed>
```

## 注意事项

- 遵循 Vue 3 组合式 API 规范，支持按需引入与 TypeScript 类型推导。

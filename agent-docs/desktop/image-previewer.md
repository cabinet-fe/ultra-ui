---
title: UImagePreviewer 图片预览
description: 单图 lightbox 预览组件：src 支持 URL（http(s):、blob:、data:）与二进制（File/Blob/ArrayBuffer/Uint8Array），Ctrl/⌘+滚轮与工具按钮缩放、双击 100%/200% 切换、放大后拖拽平移，Esc / 遮罩 / 关闭按钮退出；modal=false 内嵌渲染纯预览面供宿主自组框架（file-viewer 图片页即此用法）。
aliases: [ImagePreviewer, image-previewer, 图片预览, lightbox, 大图预览, 图片查看]
keywords:
  [
    src,
    alt,
    mime,
    modal,
    open,
    closeOnClickBackdrop,
    closeOnEsc,
    zoom-change,
    zoomIn,
    zoomOut,
    resetZoom,
    ImagePreviewerSource,
    ImagePreviewerProps,
    ImagePreviewerEmits,
    ImagePreviewerExposed,
    lightbox,
    缩放,
    平移,
    双击缩放,
    滚轮缩放,
    objectURL
  ]
---

# UImagePreviewer 图片预览

`@veltra/desktop` 导出的单图预览组件 `UImagePreviewer`：默认（`modal: true`）Teleport 到 body 的全屏 lightbox——内置右上角关闭按钮、底部缩放工具栏与百分比回显，`Ctrl/⌘+滚轮` 与工具按钮缩放（步进 0.1，范围 0.5~3），双击在 100% / 200% 间切换，放大后拖拽平移，Esc / 点击图片外区域 / 关闭按钮退出；`modal: false` 时在原位内嵌渲染纯预览面（无遮罩、关闭按钮与工具栏），供宿主嵌入自己的框架（`UFileViewer` 的图片页即此用法），缩放经 expose 方法、滚轮与双击驱动。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, UImagePreviewer } from '@veltra/desktop'
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <UButton type="primary" @click="open = true">打开预览</UButton>
  <UImagePreviewer v-model:open="open" src="/files/cover.png" alt="封面图" />
</template>
```

样式经 `unplugin-vue-components` 配 `VeltraUIResolver` 自动引入，或手动 `import '@veltra/desktop/components/image-previewer/style'`。

## API 签名

```ts
/** 图片预览源：URL（支持 http(s):、blob:、data:）或二进制原始数据 */
export type ImagePreviewerSource = string | File | Blob | ArrayBuffer | Uint8Array

/** 图片预览组件属性 */
export interface ImagePreviewerProps {
  /** 图片源；切换时重置缩放并回收上一张的 objectURL */
  src?: ImagePreviewerSource
  /** 图片 alt 文本（无障碍与加载失败回退），缺省为「图片预览」 */
  alt?: string
  /** 二进制源（ArrayBuffer / Uint8Array）的 MIME 类型提示，仅用于 objectURL 构造 */
  mime?: string
  /**
   * lightbox 模式开关，默认 true：Teleport 到 body 的全屏遮罩，内置关闭按钮、
   * Esc 关闭与缩放工具。false 时内嵌渲染纯预览面（无遮罩与关闭），供
   * file-viewer 等宿主嵌入自己的框架，缩放经 expose 方法 / 滚轮 / 双击驱动
   */
  modal?: boolean
  /** lightbox 显隐（支持 v-model:open），缺省 true */
  open?: boolean
  /** lightbox 模式点击图片外区域是否关闭，默认 true */
  closeOnClickBackdrop?: boolean
  /** lightbox 模式按 Esc 是否关闭，默认 true */
  closeOnEsc?: boolean
}

/** 图片预览组件事件 */
export interface ImagePreviewerEmits {
  (e: 'update:open', value: boolean): void
  /** lightbox 关闭时触发（关闭按钮 / Esc / 点击图片外区域） */
  (e: 'close'): void
  /** 缩放级别变化（工具按钮 / 滚轮 / 双击 / expose 方法） */
  (e: 'zoom-change', level: number): void
  /** 图片加载失败 */
  (e: 'error', err: unknown): void
}

/** 组件内部定义；ref 上实际是解包后的形态 */
export interface _ImagePreviewerExposed {
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
}

/** 图片预览组件暴露的属性和方法 */
export type ImagePreviewerExposed = DeconstructValue<_ImagePreviewerExposed>
```

## 参数说明

| 参数                   | 类型                    | 默认   | 必填 | 约束                                                                                       |
| ---------------------- | ----------------------- | ------ | :--: | ------------------------------------------------------------------------------------------ |
| `src`                  | `ImagePreviewerSource`  | `—`    |  否  | `undefined` / `null` 时清空预览面；string 直接作 `<img src>`（不做 fetch）                 |
| `alt`                  | `string`                | `图片预览` | 否 | 无障碍文本与加载失败回退                                                                   |
| `mime`                | `string`                | `—`    |  否  | 仅二进制源生效（`Uint8Array` / `ArrayBuffer` 构造 objectURL 的类型提示）；`File` / `Blob` 自带 type |
| `modal`                | `boolean`               | `true` |  否  | `true` lightbox（Teleport 到 body）；`false` 内嵌纯预览面                                   |
| `open`                 | `boolean`               | `true` |  否  | lightbox 显隐，支持 `v-model:open`；仅 `modal: true` 时参与显隐控制                         |
| `closeOnClickBackdrop` | `boolean`              | `true`  | 否  | 仅 lightbox 生效；放大后（缩放 > 100%）空白区域是平移热区，不作为关闭入口                  |
| `closeOnEsc`           | `boolean`               | `true`  | 否  | 仅 lightbox 生效；监听挂在捕获阶段并 `stopPropagation`，不与外层 Esc 处理叠加              |

## 方法与事件

### 事件

| 事件           | payload            | 触发时机                                                                 |
| -------------- | ------------------ | ------------------------------------------------------------------------ |
| `update:open`  | `value: boolean`   | lightbox 关闭时置 `false`（配合 `v-model:open`）                          |
| `close`        | `—`                | lightbox 关闭（关闭按钮 / Esc / 点击图片外区域）                          |
| `zoom-change`  | `level: number`    | 缩放级别变化（1 = 100%），工具按钮 / `Ctrl/⌘+滚轮` / 双击 / expose 方法  |
| `error`        | `err: unknown`     | `<img>` 加载失败（URL 不可达、数据损坏），预览面显示「图片加载失败」      |

### 暴露成员（模板 ref）

| 成员        | 签名        | 说明                                                       |
| ----------- | ----------- | ---------------------------------------------------------- |
| `zoomIn`    | `() => void` | 放大一级（0.1 步进，收敛在 0.5~3）                        |
| `zoomOut`   | `() => void` | 缩小一级                                                   |
| `resetZoom` | `() => void` | 重置到 100%（平移偏移一并归零）                            |

### 缩放与平移行为（内置，不可配置）

- `Ctrl / ⌘ + 滚轮`：以 0.1 步进缩放，范围 0.5~3（50%~300%）
- 双击：100% ↔ 200% 切换
- 缩放 > 100% 后可拖拽平移（Pointer Events + pointer capture）；回到 100% 平移偏移归零
- `src` 切换时重置到 100% 并回收上一张的 objectURL
- lightbox 打开期间锁定 body 滚动，关闭/卸载恢复

## 典型示例

### 预览二进制图片字节（Uint8Array + MIME 提示）

```vue
<script setup lang="ts">
import { UButton, UImagePreviewer } from '@veltra/desktop'
import { ref } from 'vue'

const open = ref(false)
// 例如表格/接口返回的图片字节：mime 提示构造 objectURL 的类型
const bytes = new Uint8Array([137, 80, 78, 71 /* … */])
</script>

<template>
  <UButton @click="open = true">预览字节图</UButton>
  <UImagePreviewer v-model:open="open" :src="bytes" mime="image/png" alt="字节图" />
</template>
```

二进制源（`File` / `Blob` / `ArrayBuffer` / `Uint8Array`）内部创建 objectURL 并在切换 / 卸载时回收；`Uint8Array` 会被复制，外部后续修改不影响预览。

### 内嵌模式：宿主自组框架 + expose 缩放

```vue
<script setup lang="ts">
import { UButton, UImagePreviewer } from '@veltra/desktop'
import type { ImagePreviewerExposed } from '@veltra/desktop'
import { useTemplateRef } from 'vue'

const previewerRef = useTemplateRef<ImagePreviewerExposed>('previewerRef')
</script>

<template>
  <!-- modal=false：无遮罩/关闭/工具栏，必须给高度；滚轮与双击缩放仍可用 -->
  <div style="display: flex; flex-direction: column; gap: 8px">
    <div>
      <UButton size="small" @click="previewerRef?.zoomIn()">放大</UButton>
      <UButton size="small" @click="previewerRef?.zoomOut()">缩小</UButton>
      <UButton size="small" @click="previewerRef?.resetZoom()">重置</UButton>
    </div>
    <UImagePreviewer
      ref="previewerRef"
      :modal="false"
      src="/files/cover.png"
      style="height: 360px"
    />
  </div>
</template>
```

`UFileViewer` 的 `image` 类别页就是内嵌用法：它提供侧栏 / 工具栏框架，图片预览面由本组件承担。

## 注意事项

> [!WARNING]
>
> - 默认就是 lightbox（`modal: true`），不需要传 `open` 也能全屏预览（`open` 缺省 `true`）；要控制显隐用 `v-model:open`。
> - string 源直接作 `<img src>`（http(s): / blob: / data: 均可），不做 fetch 与状态码检查——URL 不可达时走 `<img>` 的 `error` 事件与「图片加载失败」空态。
> - `closeOnClickBackdrop` 的「图片外区域」在放大后（缩放 > 100%）是平移热区，不作为关闭入口；关闭走 Esc 或右上角按钮。
> - 内嵌模式（`modal: false`）没有遮罩与工具栏，必须给容器高度，否则预览面塌陷为 0。
> - 缩放/平移状态在 `src` 切换时重置；组件卸载时回收 objectURL，宿主无需管理。
> - 透传的 class 等 attrs 由内层预览面承接（根为 Teleport，`inheritAttrs: false`）。

## 常见问题

### 内嵌模式（modal=false）按 Esc、点击空白都不关闭

内嵌模式没有遮罩与关闭语义（`close` 仅 lightbox 生效），显隐完全由宿主控制——内嵌用法中组件是常驻预览面（`UFileViewer` 图片页即如此）。需要可关闭的内嵌预览时，由宿主在外层包自己的容器并管理卸载。

### 缩放后双击不是切换到 200%

双击语义是「100% ↔ 200% 切换」：当前非 100%（如 150%）时双击回到 100%，不是去 200%；需要精确复位用工具栏「重置视图」按钮或 expose 的 `resetZoom()`。

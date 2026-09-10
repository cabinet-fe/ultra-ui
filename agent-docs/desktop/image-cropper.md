---
title: UImageCropper 图片裁剪
description: 画布式图片裁剪组件：滚轮以指针为锚缩放、选区外拖拽平移、90° 步进旋转与水平/垂直翻转，8 向手柄选区支持固定宽高比，实时预览，getResult 输出 PNG Blob 与 base64。
aliases: [ImageCropper, image-cropper, 图片裁剪器, 头像裁剪, 裁剪组件]
keywords: [src, aspectRatio, showToolbar, showPreview, getResult, crop-change, ImageCropperResult, ImageCropperSelection, setAspectRatio, zoomIn, zoomOut, rotate, flip, 图片裁剪, 选区拖拽, 缩放, 旋转, 翻转, 宽高比, 头像裁剪]
---

# UImageCropper 图片裁剪

`@veltra/desktop` 导出的图片裁剪组件 `UImageCropper`：画布内加载 `File` / `Blob` / URL 图片源，支持滚轮缩放（以指针为锚）、平移、90° 步进旋转、水平/垂直翻转，选区支持整体拖动与 8 向手柄调整并可锁定宽高比，实时预览裁剪结果；`getResult()` 按原图像素输出 PNG 的 `Blob` 与 base64 dataURL。

## 快速上手

```vue
<script setup lang="ts">
import { UImageCropper } from '@veltra/desktop'
import type { ImageCropperExposed, ImageCropperResult } from '@veltra/desktop'
import { ref, useTemplateRef } from 'vue'

// 需替换为可访问的图片地址
const src = ref<string>('/images/avatar.png')
const cropper = useTemplateRef<ImageCropperExposed>('cropper')
const result = ref<ImageCropperResult>()

async function exportCrop() {
  try {
    // 未加载完成 / 无选区 / 画布被跨域污染时 Promise 拒绝
    result.value = await cropper.value?.getResult()
  } catch (err) {
    console.error('导出失败:', err)
  }
}
</script>

<template>
  <!-- 宿主必须给定高度：根元素默认 height: 100% -->
  <UImageCropper ref="cropper" :src="src" :aspect-ratio="1" style="height: 480px" />
  <button @click="exportCrop">获取裁剪结果</button>
  <img v-if="result" :src="result.base64" alt="裁剪结果" />
</template>
```

## API 签名

```ts
/** 图片裁剪组件属性 */
export interface ImageCropperProps {
  /** 图片源：File / Blob / URL 字符串 */
  src?: File | Blob | string
  /** 选区宽高比（宽 / 高），不传或 <= 0 为自由比例 */
  aspectRatio?: number
  /** 是否显示工具栏。默认 true */
  showToolbar?: boolean
  /** 是否显示预览区。默认 true */
  showPreview?: boolean
}

/** getResult 输出尺寸：缺省维度按选区比例推算，都不传则为原图选区像素尺寸 */
export interface ImageCropperResultOptions {
  /** 目标输出宽度（像素） */
  width?: number
  /** 目标输出高度（像素） */
  height?: number
}

/** getResult 裁剪结果 */
export interface ImageCropperResult {
  /** 裁剪图像 Blob（image/png） */
  blob: Blob
  /** 裁剪图像的 dataURL（data:image/png;base64,...），可直接用于 img.src */
  base64: string
}

/** 裁剪选区（图片像素坐标） */
export interface ImageCropperSelection {
  x: number
  y: number
  width: number
  height: number
}

/** 影响裁剪输出的图片变换（缩放 / 平移只影响画布展示，不在其列） */
export interface ImageCropperCropTransform {
  /** 90° 步进角度：0 / 90 / 180 / 270 */
  rotation: number
  /** 水平翻转 */
  flipX: boolean
  /** 垂直翻转 */
  flipY: boolean
}

/** 裁剪变化事件载荷 */
export interface ImageCropperChangePayload {
  /** 当前选区（图片像素坐标） */
  selection: ImageCropperSelection
  /** 影响输出的图片变换摘要，与 getResult 应用的一致 */
  transform: ImageCropperCropTransform
}

/** 图片裁剪组件定义的事件 */
export interface ImageCropperEmits {
  /** 选区或图片变换变化时触发 */
  (e: 'crop-change', payload: ImageCropperChangePayload): void
}

/** 暴露成员经自动解构后可直接从模板 ref 访问 */
export interface ImageCropperExposed {
  /**
   * 输出当前选区裁剪结果：默认按原图选区像素，可传目标宽 / 高缩放输出。
   * 异步；图片未加载 / 无选区、或跨域图片污染画布时 Promise 拒绝，不静默失败
   */
  getResult: (options?: ImageCropperResultOptions) => Promise<ImageCropperResult>
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `src` | `File \| Blob \| string` | `—` | 否 | `File`/`Blob` 走 ObjectURL 并在替换与卸载时释放；URL 字符串以 `crossOrigin='anonymous'` 加载，服务器必须允许跨域，否则图片加载失败且画布区空白 |
| `aspectRatio` | `number` | `—`（自由比例） | 否 | 宽 / 高比，如 `1`、`4 / 3`、`16 / 9`；`undefined` 或 `<= 0` 为自由比例；运行中变化时选区以中心为锚按比例重算 |
| `showToolbar` | `boolean` | `true` | 否 | 工具栏含比例预设（自由 / 1:1 / 4:3 / 16:9）与缩放、旋转、翻转、重置按钮 |
| `showPreview` | `boolean` | `true` | 否 | 右侧实时预览画布，显示尺寸上限为裁剪画布区宽高的 30% |

### 交互与输出约束

- 缩放：滚轮以指针位置为锚，`deltaY < 0` 放大；滚轮与工具栏按钮单步系数 1.2，范围 `[适应容器的缩放, 适应缩放 × 10]`
- 平移：图片显示尺寸超出容器时，在选区外按下左键拖动平移；选区内拖动是移动选区，两者不冲突
- 旋转：`rotate(1)` 顺时针 90°、`rotate(-1)` 逆时针 90°，角度只取 0 / 90 / 180 / 270，旋转后自动重新适应容器
- 选区：图片加载完成后初始化为图片宽高各 80% 的居中区域（传了 `aspectRatio` 时在该框内按比例内接）；最小边长 20 图片像素；始终钳制在图片边界内
- 输出：只受选区与旋转/翻转影响；缩放、平移不改变输出内容；旋转 90°/270° 时输出宽高按选区宽高交换

## 方法与事件

### 事件 `crop-change`

- 签名：`(e: 'crop-change', payload: ImageCropperChangePayload) => void`
- 触发时机：选区（拖动 / 手柄调整 / 比例重算 / 初始化）或变换（旋转 / 翻转）变化时
- `payload.selection` 为图片像素坐标（非屏幕坐标）；`payload.transform` 为 `{ rotation, flipX, flipY }`

### 暴露方法 `getResult`

- 签名：`(options?: ImageCropperResultOptions) => Promise<ImageCropperResult>`，异步
- `options.width` / `height` 只传其一时，另一维度按选区比例推算；都不传输出原图选区像素尺寸
- 输出固定为 `image/png`；`base64` 是 `data:image/png;base64,...`
- 拒绝（reject）条件，错误消息原文：
  - 图片未加载或无选区：`Error('Export crop result failed: image not loaded or no selection')`
  - 跨域图片污染画布：`Error('Export crop result failed: canvas is tainted by cross-origin image')`
  - `canvas.toBlob` 返回空：`Error('Export crop result failed: canvas.toBlob got null')`

### 插槽 `toolbar`

覆盖默认工具栏，作用域插槽参数：`{ zoomIn, zoomOut, rotate, flip, reset, setAspectRatio, aspectRatio }`。签名：`zoomIn()` / `zoomOut()` / `reset()`；`rotate(direction: 1 | -1)`；`flip(axis: 'horizontal' | 'vertical')`；`setAspectRatio(ratio: number | undefined)`；`aspectRatio` 为当前生效比例。

## 典型示例

### 上传头像：限制 1:1 + 指定输出尺寸

```vue
<script setup lang="ts">
import { UButton, UFilePicker, UImageCropper } from '@veltra/desktop'
import type { ImageCropperExposed, ImageCropperResult } from '@veltra/desktop'
import { ref, shallowRef, useTemplateRef } from 'vue'

// 需替换为你的上传接口
const UPLOAD_URL = '<上传接口地址>'

const fileSrc = shallowRef<File>()
const cropper = useTemplateRef<ImageCropperExposed>('cropper')
const result = shallowRef<ImageCropperResult>()

function onPick(files: File[]) {
  fileSrc.value = files[0] // 换图后组件自动重置变换并清空选区
}

async function upload() {
  // 输出固定 256×256
  result.value = await cropper.value?.getResult({ width: 256, height: 256 })
  const body = new FormData()
  body.append('avatar', result.value!.blob, 'avatar.png')
  await fetch(UPLOAD_URL, { method: 'POST', body })
}
</script>

<template>
  <UFilePicker accept="image/*" @pick="onPick">
    <UButton>选择头像图片</UButton>
  </UFilePicker>

  <UImageCropper ref="cropper" :src="fileSrc" :aspect-ratio="1" style="height: 400px" />
  <UButton type="primary" :disabled="!fileSrc" @click="upload">裁剪并上传 256×256</UButton>
</template>
```

### 监听 crop-change 展示选区与变换

```vue
<script setup lang="ts">
import { UImageCropper } from '@veltra/desktop'
import type { ImageCropperChangePayload } from '@veltra/desktop'
import { shallowRef } from 'vue'

// 内置示例图用 canvas 生成 dataURL，规避外部图片的网络与跨域依赖
const sampleUrl = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 960
  canvas.height = 600
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7db9e8'
  ctx.fillRect(0, 0, 960, 600)
  return canvas.toDataURL('image/png')
})()

const info = shallowRef('')

function onCropChange(payload: ImageCropperChangePayload) {
  const { x, y, width, height } = payload.selection
  const { rotation, flipX, flipY } = payload.transform
  info.value =
    `选区 ${Math.round(width)}×${Math.round(height)} @ (${Math.round(x)}, ${Math.round(y)})` +
    (rotation ? ` · 旋转 ${rotation}°` : '') +
    (flipX ? ' · 水平翻转' : '') +
    (flipY ? ' · 垂直翻转' : '')
  // => 选区 480×480 @ (240, 60) · 旋转 90°
}
</script>

<template>
  <UImageCropper :src="sampleUrl" style="height: 480px" @crop-change="onCropChange" />
  <p>{{ info || '拖动选区，或用工具栏旋转 / 翻转' }}</p>
</template>
```

### 自定义工具栏

```vue
<script setup lang="ts">
import { UButton, UImageCropper } from '@veltra/desktop'
import type { ImageCropperExposed } from '@veltra/desktop'
import { ref, useTemplateRef } from 'vue'

// 需替换为可访问的图片地址
const src = ref<string>('/images/photo.png')
</script>

<template>
  <UImageCropper :src="src" :show-toolbar="true" style="height: 480px">
    <template #toolbar="{ rotate, flip, setAspectRatio }">
      <UButton size="small" @click="rotate(1)">顺时针 90°</UButton>
      <UButton size="small" @click="flip('horizontal')">水平翻转</UButton>
      <UButton size="small" @click="setAspectRatio(16 / 9)">16:9</UButton>
      <UButton size="small" @click="setAspectRatio(undefined)">自由</UButton>
    </template>
  </UImageCropper>
</template>
```

## 注意事项

> [!WARNING]
> - 导出名为 `UImageCropper`；组件内部 `name` 是 `ImageCropper`（无 `U` 前缀），按 name 递归引用时注意区分。
> - 宿主必须给组件高度（根元素默认 `height: 100%`），否则画布区高度为 0。
> - URL 源以 `crossOrigin='anonymous'` 加载：图床必须返回 CORS 头，否则图片加载失败；服务器允许跨域时 `getResult()` 不会被画布污染拒绝。
> - `getResult()` 拒绝时不静默失败，必须 `try/catch` 或 `.catch()` 处理；未加载完成时调用即拒绝。
> - 缩放与平移只影响画布展示，不影响裁剪输出；输出只由选区 + 旋转 + 翻转决定。
> - 旋转只支持 90° 步进（0/90/180/270），不支持任意角度。
> - 更换 `src` 会重置全部变换并清空选区；重新加载后选区回到居中 80% 初始状态。

## 常见问题

### 报错 `Error: Export crop result failed: image not loaded or no selection`

原因：图片尚未加载完成，或加载失败（常见于 URL 源缺少 CORS 头），此时选区不存在。修复：等待加载后再导出，或确认图片 URL 可跨域访问。

```ts
try {
  const result = await cropper.value?.getResult()
} catch {
  // 图片未就绪或加载失败，提示用户重新选择图片
}
```

### 报错 `Error: Export crop result failed: canvas is tainted by cross-origin image`

原因：画布被跨域数据污染，`toBlob` 被浏览器安全策略阻止。组件加载 URL 源时已带 `crossOrigin='anonymous'`，正常走组件 `src` 不会触发；此错误多为绕过组件自行注入了无 CORS 头的像素数据。修复：让组件直接以 URL 字符串 / `File` / `Blob` 作为 `src`，不要从外部替换画布内容。

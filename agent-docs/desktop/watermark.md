---
title: UWatermark 水印
description: 从 @veltra/desktop 导出的水印组件：canvas 绘制文字后平铺为背景，可调字号与旋转角度，appendToBody 时挂载到 body 覆盖整页，窗口缩放自动重绘。
aliases:
  - Watermark
  - watermark
  - 文字水印
  - 全屏水印
  - 防泄露
keywords:
  - text
  - image
  - appendToBody
  - route
  - fontSize
  - WatermarkProps
  - Teleport
  - 平铺背景
  - 防截图
  - 内部资料
  - 版权保护
---

# UWatermark 水印

`@veltra/desktop` 导出水印组件 `UWatermark`：把 `text` 文字用 canvas 绘制后以 `repeat` 背景平铺，包住默认插槽内容做局部水印，或 `appendToBody` 挂到 `body` 覆盖整页；字号、旋转角度可配，窗口缩放自动重绘。

## 快速上手

```vue
<script setup lang="ts">
import { UWatermark } from '@veltra/desktop'
</script>

<template>
  <u-watermark text="内部资料">
    <div style="min-height: 240px; padding: 24px">
      <p>这份内容带平铺水印。</p>
    </div>
  </u-watermark>
</template>
```

## API 签名

```ts
/** watermark 组件属性 */
export interface WatermarkProps {
  /** 水印文字；当前实现仅绘制 text，未传 text 时不渲染任何水印 */
  text?: string
  /** 图片地址（类型保留；当前实现未参与绘制，见注意事项） */
  image?: string
  /** 是否传送到 body 下覆盖整页。默认 false */
  appendToBody?: boolean
  /** 旋转角度，单位度（绘制时按 度*PI/180 转弧度），负值逆时针。默认 -30 */
  route?: number
  /** 水印文字字号，单位 px。默认 60 */
  fontSize?: number
}

/** watermark 组件定义的事件：无 */
export interface WatermarkEmits {}

/** watermark 组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _WatermarkExposed {}
export type WatermarkExposed = DeconstructValue<_WatermarkExposed>
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `text` | `string` | — | 否 | 水印内容来源；为空时组件不绘制、不报错 |
| `image` | `string` | — | 否 | 当前实现未使用；仅传 `image` 不传 `text` 时没有水印 |
| `appendToBody` | `boolean` | `false` | 否 | `true` 时水印 `div` Teleport 到 `body`，且默认插槽内容不渲染 |
| `route` | `number` | `-30` | 否 | 角度制数值；`0` 为水平，负值逆时针 |
| `fontSize` | `number` | `60` | 否 | 单位 px；同时影响平铺密度 |

插槽：默认插槽，仅 `appendToBody: false` 时渲染，被水印层包裹的内容。

## 典型示例

### 局部文字水印（自定义角度与字号）

```vue
<script setup lang="ts">
import { UWatermark } from '@veltra/desktop'
</script>

<template>
  <u-watermark text="CONFIDENTIAL" :font-size="40" :route="-20">
    <div style="min-height: 300px; padding: 20px">
      <p>低密度水印，适合浅色背景的正文内容。</p>
    </div>
  </u-watermark>
</template>
```

### 全页水印

```vue
<script setup lang="ts">
import { UWatermark } from '@veltra/desktop'
</script>

<template>
  <u-watermark text="Admin@张三" append-to-body />
  <!-- => 水印 div 直接挂在 body 下铺满整页，z-index 自 1000 起自增；本组件的插槽内容不渲染 -->
</template>
```

### 动态拼接用户身份水印

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { UWatermark } from '@veltra/desktop'

const account = { name: '李四', id: 'u_1024' }

// 渲染前拼接好完整文字；水印在挂载时绘制一次
const text = computed(() => `${account.name}（${account.id}）仅供内部传阅`)
</script>

<template>
  <u-watermark :text="text" :font-size="48">
    <div style="min-height: 200px; padding: 16px">
      <p>报表正文。</p>
    </div>
  </u-watermark>
</template>
```

## 注意事项

> [!WARNING]
> - 旋转参数名是 `route`，不是 `rotate`；它是角度制数值（默认 `-30`），不是弧度，绘制时才转换为弧度。
> - `image` 属性在类型中存在，但当前实现只绘制 `text` 文字水印：仅传 `image` 不传 `text` 时不会渲染任何水印，禁止依赖图片水印能力。
> - `appendToBody: true` 时组件不渲染默认插槽，水印 `div` 直接挂到 `body` 铺满整页；需要局部水印时不要开 `appendToBody`。
> - 水印在组件挂载时绘制一次，窗口 `resize` 后防抖 150ms 重绘；`text` / `fontSize` 运行时变更不会触发重绘。
> - 文字颜色固定 `rgba(0,0,0,.1)`、字体固定 `Arial`，无 props 可改；深色背景需自行覆盖背景图或在业务层处理。
> - 水印层 `z-index` 使用全局自增序列，从 `1000` 起，多个水印/弹层实例依次递增。

## 常见问题

### 页面上看不到水印

原因：未传 `text`（只传了 `image`），当前实现不绘制图片水印。修复：传入 `text`。

```vue
<template>
  <u-watermark text="内部资料">
    <div style="min-height: 200px">正文</div>
  </u-watermark>
</template>
```

### 修改 `text` 后水印没变

行为如此：水印只在挂载与窗口 `resize` 时绘制。修复：变更 `text` 后重新挂载组件（`v-if` 切换或 `:key` 换值）。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UWatermark } from '@veltra/desktop'

const text = ref('第一版')
const wmKey = ref(0)

function rebind() {
  text.value = '第二版'
  wmKey.value++ // 强制重新挂载以重绘水印
}
</script>

<template>
  <u-watermark :key="wmKey" :text="text">
    <div style="min-height: 200px">正文</div>
  </u-watermark>
</template>
```

---
title: UAvatar 头像
description: 从 @veltra/desktop 导出的头像组件：图片头像、未传图或加载失败时文字回退、circle/round 形状与三档尺寸；UAvatarGroup 支持重叠展示与 max 溢出收成 +N。
aliases: [Avatar, avatar, 头像组件, 头像组, AvatarGroup, 用户头像]
keywords:
  [
    src,
    alt,
    shape,
    circle,
    round,
    size,
    max,
    error,
    AvatarShape,
    UAvatarGroup,
    文字回退,
    加载失败,
    头像组,
    重叠展示,
    溢出收起,
    图片头像
  ]
---

# UAvatar 头像

`@veltra/desktop` 导出头像组件 `UAvatar` 与头像组组件 `UAvatarGroup`：`UAvatar` 传入 `src` 展示图片头像，未传图或图片加载失败时回退展示默认插槽内容（文字回退）；`UAvatarGroup` 包裹一组 `UAvatar` 重叠展示，设置 `max` 后超出部分收成 `+N`。

## 快速上手

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/desktop'
</script>

<template>
  <!-- 图片头像；加载失败时展示插槽文字「图」 -->
  <u-avatar src="https://example.com/user.png" alt="用户头像">图</u-avatar>

  <!-- 未传 src，直接展示插槽文字 -->
  <u-avatar>吴</u-avatar>
</template>
```

## API 签名

```ts
import type { Component } from 'vue'

export type ComponentSize = 'small' | 'default' | 'large'

/** 头像形状：circle 圆形 / round 圆角方形 */
export type AvatarShape = 'circle' | 'round'

/** 头像组件属性 */
export interface AvatarProps {
  /** 组件尺寸，默认 'default'（32px；small 24px / large 40px，随主题 token） */
  size?: ComponentSize
  /** 图片地址；未传或加载失败时回退展示默认插槽内容 */
  src?: string
  /** 图片描述，作为 img 的 alt */
  alt?: string
  /** 形状，默认 'circle' */
  shape?: AvatarShape
}

/** 头像组件事件 */
export interface AvatarEmits {
  /** 头像图片加载失败时触发；触发后组件切换到插槽内容回退展示 */
  (e: 'error', ev: Event): void
}

/** 头像组组件属性 */
export interface AvatarGroupProps {
  /** 最多展示的头像个数，超出部分以 +N 形式收起；不传则全部展示 */
  max?: number
}

/** 头像组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export interface _AvatarExposed {}
export type AvatarExposed = DeconstructValue<_AvatarExposed>
```

## 参数说明

`UAvatar`：

| 参数    | 类型            | 默认        | 必填 | 约束                                                          |
| ------- | --------------- | ----------- | :--: | ------------------------------------------------------------- |
| `src`   | `string`        | —           |  否  | 图片地址；传后优先渲染 `img`，失败回退插槽内容                |
| `alt`   | `string`        | —           |  否  | 仅作 `img` 的 `alt`，不参与回退文案                           |
| `shape` | `AvatarShape`   | `'circle'`  |  否  | 枚举 `'circle' \| 'round'`                                    |
| `size`  | `ComponentSize` | `'default'` |  否  | 枚举 `'small' \| 'default' \| 'large'`，尺寸由主题 token 决定 |

`UAvatarGroup`：

| 参数  | 类型     | 默认 | 必填 | 约束                                   |
| ----- | -------- | ---- | :--: | -------------------------------------- |
| `max` | `number` | —    |  否  | 正整数；超出部分隐藏并显示 `+N` 溢出项 |

## 方法与事件

- `error(ev: Event)`：`UAvatar` 的图片 `error` 事件透传，`ev` 为原生 `Event`。同步触发；触发后组件立即切换为插槽内容展示。
- `UAvatarGroup` 无自定义事件。

## 典型示例

### 文字回退、形状与尺寸

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/desktop'
</script>

<template>
  <u-avatar>吴</u-avatar>
  <u-avatar shape="round">圆角</u-avatar>
  <u-avatar size="small">小</u-avatar>
  <u-avatar size="large">大</u-avatar>
</template>
```

### 头像组重叠与 max 溢出

```vue
<script setup lang="ts">
import { UAvatar, UAvatarGroup } from '@veltra/desktop'
</script>

<template>
  <!-- 6 个头像只展示前 3 个，末尾显示 +3 -->
  <u-avatar-group :max="3">
    <u-avatar>吴</u-avatar>
    <u-avatar>李</u-avatar>
    <u-avatar>张</u-avatar>
    <u-avatar>王</u-avatar>
    <u-avatar>赵</u-avatar>
    <u-avatar>钱</u-avatar>
  </u-avatar-group>
</template>
```

### 图片加载失败回退与 error 事件

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/desktop'

function onError(ev: Event) {
  console.log('头像加载失败', ev) // => 断网或地址 404 时输出
}
</script>

<template>
  <!-- 地址无效：img 触发 error，组件自动改展示插槽文字「备」，并发出 error 事件 -->
  <u-avatar src="/not-exists.png" @error="onError">备</u-avatar>
</template>
```

## 注意事项

> [!WARNING]
>
> - 本库 `shape` 取值是 `'circle' \| 'round'`，不是 Ant Design Avatar 的 `'circle' | 'square'`。
> - `size` 只支持 `'small' | 'default' | 'large'` 三档（24 / 32 / 40px，随主题 token），不支持 AntD 的数字像素尺寸。
> - 本库无 `icon` 属性：图标回退直接在默认插槽放内容（如 `<u-avatar><u-icon><User /></u-icon></u-avatar>`）。
> - `UAvatarGroup` 的插槽子节点必须是 `UAvatar`：`max` 统计的是插槽子节点总数，混入其它元素会被计入并参与截断。
> - `UAvatarGroup` 不透传尺寸给子头像：需要统一尺寸时在每个 `UAvatar` 上设置。
> - 溢出项显示 `+N` 文本，不渲染被隐藏的头像；`N` 为「子节点总数 − max」。

## 常见问题

### 传了 src 但显示的是插槽文字

原因：图片加载失败（404、断网）或 `src` 为空字符串。组件在加载失败时自动回退到插槽内容。修复：确认地址可访问，或接受回退展示。

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/desktop'
</script>

<template>
  <u-avatar src="https://example.com/user.png" alt="用户头像">备</u-avatar>
</template>
```

### 头像组内头像没有重叠、+N 不出现

原因：`UAvatarGroup` 里包了非 `UAvatar` 的包裹元素（如 `div`），导致插槽子节点只有 1 个。修复：把 `UAvatar` 作为组的直接子节点。

```vue
<script setup lang="ts">
import { UAvatar, UAvatarGroup } from '@veltra/desktop'
</script>

<template>
  <u-avatar-group :max="2">
    <u-avatar>吴</u-avatar>
    <u-avatar>李</u-avatar>
    <u-avatar>张</u-avatar>
  </u-avatar-group>
</template>
```

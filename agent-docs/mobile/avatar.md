---
title: UAvatar 头像（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端头像组件：图片头像、未传图或加载失败时插槽文字回退、circle/round 形状与三档尺寸；src 切换时自动重置加载失败态。移动端不导出 UAvatarGroup。'
aliases: [UAvatar, Avatar, 头像, 头像组件, 用户头像, 移动端头像]
keywords:
  [
    UAvatar,
    AvatarProps,
    AvatarEmits,
    AvatarExposed,
    AvatarShape,
    src,
    alt,
    shape,
    circle,
    round,
    size,
    error,
    文字回退,
    加载失败,
    图片头像,
    移动端头像
  ]
---

# UAvatar 头像（@veltra/mobile 移动端）

`@veltra/mobile` 导出头像组件 `UAvatar`（`packages/mobile/src/index.ts` 具名导出）：传入 `src` 展示图片头像，未传图或图片加载失败时回退展示默认插槽内容（文字回退）；`shape` 切换圆形与圆角方形，`size` 三档尺寸。移动端包不导出 `UAvatarGroup`，头像组需求自行循环渲染 `UAvatar` 排列。

## 快速上手

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/mobile'
import '@veltra/mobile/components/avatar/style'
</script>

<template>
  <!-- 图片头像；加载失败时展示插槽文字「图」 -->
  <u-avatar src="https://example.com/user.png" alt="用户头像">图</u-avatar>

  <!-- 未传 src，直接展示插槽文字 -->
  <u-avatar>吴</u-avatar>
</template>
```

视觉初始化前提：应用入口需要 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、头像无背景色。组件样式按需引入 `@veltra/mobile/components/avatar/style`，仅导入组件不带入样式。

## API 签名

```ts
/** 头像形状：circle 圆形 / round 圆角方形 */
export type AvatarShape = 'circle' | 'round'

/** 头像组件属性（size 继承自 ComponentProps） */
export interface AvatarProps extends ComponentProps {
  /** 图片地址；未传或加载失败时回退展示默认插槽内容 */
  src?: string
  /** 图片描述，作为 img 的 alt */
  alt?: string
  /** 形状，默认 'circle' */
  shape?: AvatarShape
  /** 组件尺寸，默认 'default'（light 主题 32px；small 24px / large 40px，随主题 token） */
  size?: ComponentSize
}

/** 头像组件事件 */
export interface AvatarEmits {
  /** 头像图片加载失败时触发；触发后组件切换到插槽内容回退展示 */
  (e: 'error', ev: Event): void
}

/** 头像组件暴露的属性和方法（经 DeconstructValue 解包；本组件无暴露成员） */
export type AvatarExposed = {}
```

## 参数说明

| 参数    | 类型                                       | 默认        | 必填 | 约束                                                                |
| ------- | ------------------------------------------ | ----------- | :--: | ------------------------------------------------------------------- |
| `src`   | `string`                                   | —           |  否  | 图片地址；传后优先渲染 `img`，加载失败回退插槽内容；切换时重置失败态 |
| `alt`   | `string`                                   | —           |  否  | 仅作 `img` 的 `alt`，不参与回退文案                                 |
| `shape` | `'circle' \| 'round'`                      | `'circle'`  |  否  | `circle` 圆形（`border-radius: 50%`），`round` 圆角方形（`--u-radius-large`） |
| `size`  | `'small' \| 'default' \| 'large'`          | `'default'` |  否  | 三档，宽高取 `--u-form-component-height-<size>`（light 主题 24 / 32 / 40px） |

插槽：默认插槽放回退内容（文字或图标）。回退容器 `white-space: nowrap`，长文本会溢出裁切，放一至两个字符。

视觉默认值：背景 `--u-color-primary`、文字白色、`overflow: hidden`、`object-fit: cover`。

## 方法与事件

`error(ev: Event)`：`img` 原生 `error` 事件的透传，`ev` 为原生 `Event`。同步触发；触发后组件立即把内部 `errored` 置为 true 并切换为插槽内容展示。`src` 变化时 `errored` 重置为 false，新地址重新尝试加载。

## 典型示例

### 文字回退、形状与尺寸

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/mobile'
import '@veltra/mobile/components/avatar/style'
</script>

<template>
  <u-avatar>吴</u-avatar>
  <u-avatar shape="round">圆角</u-avatar>
  <u-avatar size="small">小</u-avatar>
  <u-avatar size="large">大</u-avatar>
</template>
```

### 图片加载失败回退与 error 事件

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/mobile'
import { shallowRef } from 'vue'
import '@veltra/mobile/components/avatar/style'

const failed = shallowRef(false)

function onError(ev: Event) {
  failed.value = true // 断网或地址 404 时触发
}
</script>

<template>
  <!-- 地址无效：img 触发 error，组件自动改展示插槽文字「备」，并发出 error 事件 -->
  <u-avatar src="/not-exists.png" @error="onError">备</u-avatar>
  <span>{{ failed ? '已回退插槽文字' : '正常展示图片' }}</span>
</template>
```

### 头像列表（自行排列）

移动端没有 `UAvatarGroup`，头像列表用 `USpace` 循环渲染；需要重叠展示时自行写负 margin：

```vue
<script setup lang="ts">
import { UAvatar, USpace } from '@veltra/mobile'
import '@veltra/mobile/components/avatar/style'
import '@veltra/mobile/components/space/style'

const users = ['吴', '李', '张', '王']
</script>

<template>
  <u-space :size="8">
    <u-avatar v-for="name in users" :key="name" size="small">{{ name }}</u-avatar>
  </u-space>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端不导出 `UAvatarGroup`（桌面端导出，支持 `max` 溢出收成 `+N`）；移动端头像组需求自行循环渲染，溢出 `+N` 项自行实现。
> - 本库 `shape` 取值是 `'circle' | 'round'`，不是 Ant Design Avatar 的 `'circle' | 'square'`。
> - `size` 只支持 `'small' | 'default' | 'large'` 三档（light 主题 24 / 32 / 40px，随主题 token），不支持数字像素尺寸。
> - 本库无 `icon` 属性：图标回退直接在默认插槽放内容（如 `<u-avatar><u-icon><User /></u-icon></u-avatar>`）。
> - `UAvatar` 是展示组件，未绑定点击事件；需要「点头像进个人页」时自行在外层包可点击元素并保证触控热区不小于 44×44。
> - 插槽回退内容放一至两个字符：回退容器不折行，长文本被 `overflow: hidden` 裁切。
> - 组件样式按需引入 `@veltra/mobile/components/avatar/style`，仅 `import { UAvatar } from '@veltra/mobile'` 不带入样式。

## 常见问题

### 传了 src 但显示的是插槽文字

原因：图片加载失败（404、断网）或 `src` 为空字符串。组件在加载失败时自动回退到插槽内容。修复：确认地址可访问，或接受回退展示：

```vue
<script setup lang="ts">
import { UAvatar } from '@veltra/mobile'
import '@veltra/mobile/components/avatar/style'
</script>

<template>
  <u-avatar src="https://example.com/user.png" alt="用户头像">备</u-avatar>
</template>
```

### 切换 src 后头像一直显示回退文字

原因：上一个地址加载失败后 `errored` 已置 true。修复：无需处理——`src` 变化时组件自动重置错误态并重新尝试加载新地址；确认新地址本身可访问。

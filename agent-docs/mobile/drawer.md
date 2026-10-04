---
title: UDrawer 抽屉（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端抽屉组件：v-model 控制显隐，从上/下/左/右四个方向滑出，带遮罩与可选标题栏/关闭按钮；direction="bottom" 时呈现底部面板形态，顶部有拖拽把手，下拉超过 100px 关闭。API 与 @veltra/desktop 的 UDrawer 同名。'
aliases: [Drawer, 抽屉面板, 侧滑面板, 底部面板, 移动端抽屉]
keywords:
  [
    modelValue,
    update:modelValue,
    close,
    closed,
    direction,
    showClose,
    title,
    grabber,
    DrawerDirection,
    DrawerMode,
    DrawerProps,
    标题栏,
    把手,
    下拉关闭,
    侧滑,
    底部面板,
    遮罩层,
    关闭按钮,
    关闭动画结束
  ]
---

# UDrawer 抽屉（@veltra/mobile 移动端）

`@veltra/mobile` 导出的 `UDrawer` 是移动端抽屉组件：用 `v-model`（`modelValue`）控制显隐，`direction` 决定从上/下/左/右哪个方向滑出，内容通过 Teleport 渲染在 `body` 下的全屏遮罩内。`direction="bottom"`（底部面板形态）时面板顶部渲染**拖拽把手**，按住下拉超过 100px 松手即关闭；传 `title` 或 `showClose` 时内容区上方渲染标题栏。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDrawer } from '@veltra/mobile'
import '@veltra/mobile/components/drawer/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开抽屉</UButton>

  <UDrawer v-model="visible" direction="bottom" title="用户详情" show-close>
    <p>底部面板内容，按住顶部把手下拉可关闭</p>
  </UDrawer>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/drawer/style`。

## API 签名

```ts
/** 抽屉方向 */
export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉模式。已声明，当前没有任何 prop 使用，没有 `mode` 属性 */
export type DrawerMode = 'edge' | 'inset'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉。默认 false */
  modelValue?: boolean
  /** 抽屉方向。默认 'right' */
  direction?: DrawerDirection
  /** 是否显示关闭按钮。默认 false */
  showClose?: boolean
  /** 抽屉标题；传入时（或 showClose 为 true 时）在内容区上方渲染标题栏，不传则不渲染标题栏 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  /** 更新抽屉显示状态 */
  (e: 'update:modelValue', value: boolean): void
  /** 开始关闭时触发（点遮罩、点关闭按钮、下拉关闭） */
  (e: 'close'): void
  /** 完全关闭后触发：抽屉与遮罩的退出动画结束、节点已移除时 */
  (e: 'closed'): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态）。
 * 当前为空对象：UDrawer 没有暴露任何方法
 */
export interface DrawerExposed {}
```

## 参数说明

| 参数         | 类型                                     | 默认      | 必填 | 约束                                                                                    |
| ------------ | ---------------------------------------- | --------- | :--: | --------------------------------------------------------------------------------------- |
| `modelValue` | `boolean`                                | `false`   |  否  | 用 `v-model` 绑定显隐                                                                   |
| `direction`  | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` |  否  | 决定滑出方向与对应过渡动画 `drawer-slide-*`；`'bottom'` 时渲染拖拽把手并支持下拉关闭   |
| `showClose`  | `boolean`                                | `false`   |  否  | 关闭按钮渲染在标题栏右侧（触控热区不小于 44x44），点击关闭                              |
| `title`      | `string`                                 | —         |  否  | 传入时在内容区上方渲染标题栏（`min-height` 48px、底部一条分隔线）；不传且 `showClose` 为 `false` 时标题栏不渲染也不占位，内容全部来自默认插槽 |

抽屉尺寸固定（无 `size` / `width` prop）：左右方向宽 `min(86vw, 400px)`，上下方向高上限 `min(70vh, 560px)`；`'bottom'` 方向内容区底部额外加 `env(safe-area-inset-bottom)` 安全区内边距。自定义尺寸必须覆盖样式类 `.um-drawer`。

## 方法与事件

| 名称                | 类型                       | 触发时机                                                                                                        |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean) => void` | 关闭开始时（`close()` 内同步把 `modelValue` 置 `false`），配合 `v-model` 同步；随后才播放滑出与遮罩退场动画      |
| `close`             | `()`                       | 点遮罩、点关闭按钮或下拉关闭松手时触发一次（开始关闭的时刻，非动画结束后）                                        |
| `closed`            | `()`                       | 退出动画全部结束后触发一次：抽屉滑出 → 遮罩淡出，遮罩与抽屉节点都已移除时                                        |

- 下拉关闭：仅 `direction="bottom"` 提供。把手整行 44px 触控热区，向下拖动时面板实时跟随；松手时下拉距离超过 100px 即关闭，否则回弹到原位。拖动期间禁用滑动过渡，关闭时从当前位置继续滑出。
- 插槽：`#default`（抽屉主体内容，内容区超出高度自动滚动，`-webkit-overflow-scrolling: touch`）。
- `UDrawer` 没有暴露任何 ref 方法（`DrawerExposed` 为空对象）；关闭只能通过点遮罩、点关闭按钮、下拉关闭或把 `v-model` 置 `false`。

## 典型示例

### 底部面板 + close / closed 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDrawer } from '@veltra/mobile'
import '@veltra/mobile/components/drawer/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)

function onClose() {
  // 点遮罩、点关闭按钮或下拉关闭松手时触发，此刻抽屉开始播放退出动画
  console.log('抽屉开始关闭')
}

function onClosed() {
  // 退出动画全部结束、节点已移除：适合在这里重置表单、销毁大对象
  console.log('抽屉已完全关闭')
}
</script>

<template>
  <UButton type="primary" @click="visible = true">打开底部面板</UButton>

  <UDrawer v-model="visible" direction="bottom" title="筛选" @close="onClose" @closed="onClosed">
    <p>面板内容；按住顶部把手下拉超过 100px 松手即关闭</p>
  </UDrawer>
</template>
```

### 四个方向与无标题形态

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UButton, UDrawer } from '@veltra/mobile'
import '@veltra/mobile/components/drawer/style'
import '@veltra/mobile/components/button/style'

const visible = reactive({ left: false, right: false, top: false, bottom: false, plain: false })
</script>

<template>
  <UButton @click="visible.left = true">左侧</UButton>
  <UButton @click="visible.top = true">顶部</UButton>
  <UButton @click="visible.bottom = true">底部</UButton>
  <UButton @click="visible.plain = true">仅关闭按钮</UButton>

  <UDrawer v-model="visible.left" direction="left" title="导航">
    <p>从左侧滑入，宽 min(86vw, 400px)</p>
  </UDrawer>

  <UDrawer v-model="visible.top" direction="top" title="通知">
    <p>从顶部滑入，高上限 min(70vh, 560px)</p>
  </UDrawer>

  <UDrawer v-model="visible.bottom" direction="bottom" title="底部">
    <p>从底部滑入，带下拉关闭把手</p>
  </UDrawer>

  <!-- 不传 title 时标题栏不渲染；showClose 单独控制关闭按钮（此时渲染仅含按钮的标题栏） -->
  <UDrawer v-model="visible.plain" direction="bottom" show-close>
    <p>无标题内容面板</p>
  </UDrawer>
</template>
```

### 长内容滚动与表单收尾

```vue
<script setup lang="ts">
import type { FormExposed } from '@veltra/mobile'
import { UButton, UDrawer, UForm, UInput } from '@veltra/mobile'
import { reactive, shallowRef } from 'vue'
import '@veltra/mobile/components/drawer/style'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const visible = shallowRef(false)
const formRef = shallowRef<FormExposed>()
const form = reactive({ name: '初始值' })

function onClosed() {
  // 抽屉与遮罩的退出动画都结束、节点已移除后才执行收尾
  formRef.value?.reset()
}
</script>

<template>
  <UButton @click="visible = true">编辑</UButton>

  <UDrawer v-model="visible" direction="bottom" title="编辑" @closed="onClosed">
    <!-- 内容区超高自动滚动，无需自写滚动样式 -->
    <UForm ref="formRef" :model="form">
      <UInput label="姓名" field="name" />
    </UForm>
    <UButton type="primary" @click="visible = false">保存</UButton>
  </UDrawer>
</template>
```

## 注意事项

> [!WARNING]
>
> - 移动端 `direction="bottom"` 时**顶部渲染拖拽把手，下拉超过 100px 松手即关闭**；桌面端四个方向均无把手与下拉关闭。
> - 移动端抽屉尺寸是左右宽 `min(86vw, 400px)`、上下高上限 `min(70vh, 560px)`；桌面端固定 320px。两者都没有 `size` / `width` prop，自定义尺寸必须覆盖 `.um-drawer` 样式。
> - 移动端关闭按钮在**标题栏内右侧**（热区不小于 44x44）；桌面端按钮在抽屉外沿外侧 52px 悬浮。
> - 移动端 `close` 与 `update:modelValue(false)` 在关闭**开始时**同步发出，动画随后播放；桌面端 `update:modelValue(false)` 在滑出动画结束后才发出。要「动画后回调」一律用 `closed`。
> - 标题栏渲染条件是 `title || showClose`：两者都不传时标题栏不渲染也不占位；只传 `showClose` 时渲染仅含关闭按钮的标题栏。标题栏样式不可配置，需要自定义标题区时不要传 `title`，直接在默认插槽里写。
> - 关闭按钮的绑定名是 `showClose`，不是 `closable`；没有 `mask-closable` prop，点遮罩始终会关闭。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` / `visible`。
> - `DrawerMode`（`'edge' | 'inset'`）是已声明未使用的类型，组件没有 `mode` 属性。
> - 内容区自带滚动（超出 `min(70vh, 560px)` 高度上限时），禁止再包一层滚动容器。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 关闭后需要做收尾（重置表单、销毁大对象）

监听 `closed`，它在抽屉和遮罩的退出动画都结束、节点已移除后触发一次。不要在 `close` 里做收尾（那时动画刚开始、内容还在屏幕上），也不要用 `watch(visible)` 的 `false` 分支（比 `closed` 早一个遮罩淡出）。

```vue
<script setup lang="ts">
import { reactive, shallowRef } from 'vue'

import { UDrawer } from '@veltra/mobile'
import '@veltra/mobile/components/drawer/style'

const visible = shallowRef(false)
const cache = reactive<{ payload?: unknown }>({})

function onClosed() {
  // 节点已移除后清空缓存
  cache.payload = undefined
}
</script>

<template>
  <UDrawer v-model="visible" direction="bottom" title="详情" @closed="onClosed">
    <p>内容</p>
  </UDrawer>
</template>
```

### 下拉把手没有反应

原因：只有 `direction="bottom"` 渲染把手（`'left'` / `'right'` / `'top'` 无把手）；或下拉距离未超过 100px 松手（此时回弹，属预期行为）。修复：确认 `direction="bottom"`，下拉超过 100px 后松手。

### 点遮罩没有关闭

点遮罩关闭是内置行为，检查是否把遮罩区域的点击事件在外层拦截（如透明全屏容器 `@click.stop`）。组件本身点遮罩一定关闭（走 `close()`，触发 `close` 事件并把 `modelValue` 置 `false`）。

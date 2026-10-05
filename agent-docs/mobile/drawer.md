---
title: UDrawer 抽屉（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端抽屉组件：v-model 控制显隐，placement 决定从上/下/左/右哪个方位滑出（默认 bottom 底部面板）。四个方位均支持沿关闭方向拖拽内沿把手关闭（位移 ≥100px 或甩动速度达标），打开期间背景滚动锁定、完全关闭后恢复原滚动位置。'
aliases: [Drawer, 抽屉面板, 侧滑面板, 底部面板, 移动端抽屉]
keywords:
  [
    modelValue,
    update:modelValue,
    close,
    closed,
    placement,
    showClose,
    title,
    grabber,
    DrawerPlacement,
    DrawerMode,
    DrawerProps,
    标题栏,
    把手,
    拖拽关闭,
    边缘手势,
    侧滑,
    底部面板,
    遮罩层,
    关闭按钮,
    滚动锁定,
    关闭动画结束
  ]
---

# UDrawer 抽屉（@veltra/mobile 移动端）

`@veltra/mobile` 导出的 `UDrawer` 是移动端抽屉组件：用 `v-model`（`modelValue`）控制显隐，`placement` 决定从上/下/左/右哪个方位滑出（**默认 `'bottom'`**，移动端惯例底部面板），内容通过 Teleport 渲染在 `body` 下的全屏遮罩内。四个方位的面板内沿都有**拖拽把手**，沿关闭方向拖拽跟手、松手达标即关闭；传 `title` 或 `showClose` 时内容区上方渲染标题栏。打开期间背景滚动被锁定，完全关闭后恢复原滚动位置。

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

  <UDrawer v-model="visible" title="用户详情" show-close>
    <p>底部面板内容，按住顶部把手下拉可关闭</p>
  </UDrawer>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/drawer/style`。

## API 签名

```ts
/** 抽屉方位（NutUI 惯例 prop 名），决定滑出方向与对应边缘的拖拽关闭手势 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉模式。已声明，当前没有任何 prop 使用，没有 `mode` 属性 */
export type DrawerMode = 'edge' | 'inset'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉。默认 false */
  modelValue?: boolean
  /** 抽屉方位。默认 'bottom'（移动端惯例底部面板） */
  placement?: DrawerPlacement
  /** 是否显示关闭按钮。默认 false */
  showClose?: boolean
  /** 抽屉标题；传入时（或 showClose 为 true 时）在内容区上方渲染标题栏，不传则不渲染标题栏 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  /** 更新抽屉显示状态 */
  (e: 'update:modelValue', value: boolean): void
  /** 开始关闭时触发（点遮罩、点关闭按钮、拖拽关闭松手达标） */
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

| 参数         | 类型                                     | 默认      | 必填 | 约束                                                                                     |
| ------------ | ---------------------------------------- | --------- | :--: | ---------------------------------------------------------------------------------------- |
| `modelValue` | `boolean`                                | `false`   |  否  | 用 `v-model` 绑定显隐                                                                    |
| `placement`  | `'left' \| 'right' \| 'top' \| 'bottom'` | `'bottom'` |  否  | 决定滑出方位、对应过渡动画 `drawer-slide-*`、拖拽把手的形态与关闭方向                    |
| `showClose`  | `boolean`                                | `false`   |  否  | 关闭按钮渲染在标题栏右侧（触控热区不小于 44x44），点击关闭                               |
| `title`      | `string`                                 | —         |  否  | 传入时在内容区上方渲染标题栏（`min-height` 48px、底部一条分隔线）；不传且 `showClose` 为 `false` 时标题栏不渲染也不占位，内容全部来自默认插槽 |

抽屉尺寸固定（无 `size` / `width` prop）：左右方位宽 `min(86%, 400px)`（相对弹层宿主），上下方位高上限 `min(70%, 560px)`；`'bottom'` 方位面板底部额外加 `env(safe-area-inset-bottom)` 安全区内边距，`'top'` 方位顶部加 `env(safe-area-inset-top)`。自定义尺寸必须覆盖样式类 `.um-drawer`。

## 方法与事件

| 名称                | 类型                       | 触发时机                                                                                                        |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: boolean) => void` | 关闭开始时（`close()` 内同步把 `modelValue` 置 `false`），配合 `v-model` 同步；随后才播放滑出与遮罩退场动画      |
| `close`             | `()`                       | 点遮罩、点关闭按钮或拖拽把手松手达标时触发一次（开始关闭的时刻，非动画结束后）                                    |
| `closed`            | `()`                       | 退出动画全部结束后触发一次：抽屉滑出 → 遮罩淡出，遮罩与抽屉节点都已移除、背景滚动已恢复时                          |

- **四向拖拽关闭**：每个方位的内沿都有 44x44 热区的拖拽把手——`bottom` 是面板顶部整行横把手（向下拉），`top` 是面板底部整行横把手（向上推），`left` 是面板右内沿中部的竖把手（向左拖），`right` 是面板左内沿中部的竖把手（向右拖）。拖动期间面板实时跟随（反方向拖动面板不动）；松手时沿关闭方向位移 ≥100px 或甩动速度 ≥0.3px/ms 即关闭，否则带过渡回弹到原位；来电、落到多指等手势被打断的情况一律回弹。
- **滚动锁定**：打开期间背景（未注册弹层宿主时为 body）滚动被锁定；`closed` 触发的同时恢复原滚动位置。抽屉内容区自身照常滚动。
- 插槽：`#default`（抽屉主体内容，内容区超出高度自动滚动，`-webkit-overflow-scrolling: touch`）。
- `UDrawer` 没有暴露任何 ref 方法（`DrawerExposed` 为空对象）；关闭只能通过点遮罩、点关闭按钮、拖拽把手或把 `v-model` 置 `false`。

## 典型示例

### 底部面板（默认方位）+ close / closed 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDrawer } from '@veltra/mobile'
import '@veltra/mobile/components/drawer/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)

function onClose() {
  // 点遮罩、点关闭按钮或拖拽关闭松手时触发，此刻抽屉开始播放退出动画
  console.log('抽屉开始关闭')
}

function onClosed() {
  // 退出动画全部结束、节点已移除、背景滚动已恢复：适合在这里重置表单、销毁大对象
  console.log('抽屉已完全关闭')
}
</script>

<template>
  <UButton type="primary" @click="visible = true">打开底部面板</UButton>

  <UDrawer v-model="visible" title="筛选" @close="onClose" @closed="onClosed">
    <p>面板内容；按住顶部把手下拉超过 100px 松手即关闭</p>
  </UDrawer>
</template>
```

### 四个方位与拖拽把手

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

  <!-- 左侧：按住右内沿中部竖把手向左拖关闭 -->
  <UDrawer v-model="visible.left" placement="left" title="导航">
    <p>从左侧滑入，宽 min(86%, 400px)</p>
  </UDrawer>

  <!-- 顶部：按住底部横把手向上推关闭 -->
  <UDrawer v-model="visible.top" placement="top" title="通知">
    <p>从顶部滑入，高上限 min(70%, 560px)</p>
  </UDrawer>

  <!-- 底部（默认方位）：按住顶部横把手下拉关闭 -->
  <UDrawer v-model="visible.bottom" placement="bottom" title="底部">
    <p>从底部滑入，带下拉关闭把手</p>
  </UDrawer>

  <!-- 不传 title 时标题栏不渲染；showClose 单独控制关闭按钮（此时渲染仅含按钮的标题栏） -->
  <UDrawer v-model="visible.plain" placement="bottom" show-close>
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
  // 抽屉与遮罩的退出动画都结束、节点已移除、背景滚动已恢复后才执行收尾
  formRef.value?.reset()
}
</script>

<template>
  <UButton @click="visible = true">编辑</UButton>

  <UDrawer v-model="visible" title="编辑" @closed="onClosed">
    <!-- 打开期间背景页面不可滚，内容区超高自动滚动 -->
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
> - 移动端 `placement` **默认 `'bottom'`**；prop 名是 `placement`，不是桌面端的 `direction`（旧版移动端用 `direction`、默认 `'right'`，已按 NutUI 惯例重命名，旧写法不再生效）。
> - **四个方位都支持拖拽关闭**（把手形态与关闭方向见「方法与事件」）；桌面端四个方位均无把手与拖拽关闭。
> - **打开期间背景滚动锁定**（未注册弹层宿主时锁 body，iOS Safari 下也能锁住橡皮筋滚动），`closed` 后恢复原滚动位置；内容区自身照常滚动。
> - 移动端抽屉尺寸是左右宽 `min(86%, 400px)`、上下高上限 `min(70%, 560px)`；桌面端固定 320px。两者都没有 `size` / `width` prop，自定义尺寸必须覆盖 `.um-drawer` 样式。
> - 移动端关闭按钮在**标题栏内右侧**（热区不小于 44x44）；桌面端按钮在抽屉外沿外侧 52px 悬浮。
> - 移动端 `close` 与 `update:modelValue(false)` 在关闭**开始时**同步发出，动画随后播放；桌面端 `update:modelValue(false)` 在滑出动画结束后才发出。要「动画后回调」一律用 `closed`。
> - 标题栏渲染条件是 `title || showClose`：两者都不传时标题栏不渲染也不占位；只传 `showClose` 时渲染仅含关闭按钮的标题栏。标题栏样式不可配置，需要自定义标题区时不要传 `title`，直接在默认插槽里写。
> - 关闭按钮的绑定名是 `showClose`，不是 `closable`；没有 `mask-closable` prop，点遮罩始终会关闭。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` / `visible`。
> - `DrawerMode`（`'edge' | 'inset'`）是已声明未使用的类型，组件没有 `mode` 属性。
> - 内容区自带滚动（超出高度上限时），禁止再包一层滚动容器。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 从旧版迁移：direction 不生效

旧版用 `direction` prop（默认 `'right'`）。本版已重命名为 `placement`（默认 `'bottom'`）：把 `direction="left"` 改成 `placement="left"` 即可；类型 `DrawerDirection` 同步更名为 `DrawerPlacement`。不传 `placement` 时行为从右侧滑入变为底部面板。

### 关闭后需要做收尾（重置表单、销毁大对象）

监听 `closed`，它在抽屉和遮罩的退出动画都结束、节点已移除、背景滚动已恢复后触发一次。不要在 `close` 里做收尾（那时动画刚开始、内容还在屏幕上），也不要用 `watch(visible)` 的 `false` 分支（比 `closed` 早一个遮罩淡出）。

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
  <UDrawer v-model="visible" title="详情" @closed="onClosed">
    <p>内容</p>
  </UDrawer>
</template>
```

### 拖拽把手没有反应

确认拖的是当前方位对应的那条内沿（`bottom` 顶部横把手 / `top` 底部横把手 / `left` 右内沿竖把手 / `right` 左内沿竖把手），且拖动方向朝关闭方向（反方向拖动面板不动）；或位移未达 100px 且速度不够时松手（此时回弹，属预期行为，快速轻甩也能关闭）。

### 点遮罩没有关闭

点遮罩关闭是内置行为，检查是否把遮罩区域的点击事件在外层拦截（如透明全屏容器 `@click.stop`）。组件本身点遮罩一定关闭（走 `close()`，触发 `close` 事件并把 `modelValue` 置 `false`）。

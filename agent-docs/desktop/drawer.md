---
title: UDrawer 抽屉
description: "从 @veltra/desktop 导入的抽屉组件：v-model 控制显隐，从上/下/左/右四个方向滑出，带半透明遮罩与可选关闭按钮，点遮罩或关闭按钮关闭。"
aliases: [Drawer, 抽屉面板, 侧滑面板, SlidePanel, 侧边抽屉]
keywords: [modelValue, update:modelValue, close, direction, showClose, DrawerDirection, DrawerExposed, 侧滑, 滑出面板, 遮罩层, 侧边栏, 关闭按钮, 顶部通知条, 底部面板]
---

# UDrawer 抽屉

`@veltra/desktop` 导出的 `UDrawer` 是抽屉组件：用 `v-model`（`modelValue`）控制显隐，`direction` 决定从上/下/左/右哪个方向滑出，内容通过 Teleport 渲染在 `body` 下的全屏遮罩内。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDrawer } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开抽屉</UButton>

  <UDrawer v-model="visible" show-close>
    <p>右侧抽屉内容，默认 direction 为 'right'</p>
  </UDrawer>
</template>
```

## API 签名

```ts
/** 抽屉方向 */
export type DrawerDirection = 'left' | 'right' | 'top' | 'bottom'

/** 抽屉组件属性 */
export interface DrawerProps {
  /** 是否显示抽屉。默认 false */
  modelValue?: boolean
  /** 抽屉方向。默认 'right' */
  direction?: DrawerDirection
  /** 是否显示关闭按钮。默认 false */
  showClose?: boolean
  /** 抽屉标题。已声明但当前版本模板未渲染 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  /** 更新抽屉显示状态 */
  (e: 'update:modelValue', value: boolean): void
  /** 点遮罩或关闭按钮、抽屉开始关闭时触发 */
  (e: 'close'): void
  /** 完全关闭后触发。已声明但当前版本组件未 emit，不会触发 */
  (e: 'closed'): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态）。
 * 当前为空对象：UDrawer 没有暴露任何方法
 */
export interface DrawerExposed {}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `boolean` | `false` | 否 | 用 `v-model` 绑定显隐 |
| `direction` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 否 | 决定滑出方向与对应过渡动画 `drawer-slide-*` |
| `showClose` | `boolean` | `false` | 否 | 关闭按钮渲染在抽屉外沿一侧（距边缘外侧 52px 处），点击关闭 |
| `title` | `string` | — | 否 | 已声明但当前版本不渲染标题，标题文字直接写进默认插槽 |

## 方法与事件

| 名称 | 类型 | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean) => void` | 抽屉开始关闭时发出 `false`，配合 `v-model` 同步 |
| `close` | `()` | 点遮罩或点关闭按钮时触发一次（开始关闭的时刻，非动画结束后） |
| `closed` | `()` | 类型中已声明，但当前版本组件内部从未 `emit('closed')`，监听不会得到回调 |

`UDrawer` 没有暴露任何 ref 方法（`DrawerExposed` 为空对象）；关闭只能通过点遮罩、点关闭按钮或把 `v-model` 置 `false`。

## 典型示例

### 右侧详情抽屉 + 关闭事件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDrawer } from '@veltra/desktop'

const visible = ref(false)

function onClose() {
  // 点遮罩或关闭按钮时触发，此刻抽屉开始播放退出动画
  console.log('抽屉开始关闭')
}
</script>

<template>
  <UButton type="primary" @click="visible = true">查看详情</UButton>

  <UDrawer v-model="visible" show-close @close="onClose">
    <div style="padding: 16px">
      <h3>用户详情</h3>
      <p>这里是抽屉主体内容</p>
    </div>
  </UDrawer>
</template>
```

### 左侧导航抽屉与底部面板

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDrawer } from '@veltra/desktop'

const navVisible = ref(false)
const panelVisible = ref(false)
</script>

<template>
  <UButton @click="navVisible = true">菜单</UButton>
  <UButton @click="panelVisible = true">面板</UButton>

  <UDrawer v-model="navVisible" direction="left" show-close>
    <nav style="padding: 16px">
      <ul>
        <li>首页</li>
        <li>关于</li>
      </ul>
    </nav>
  </UDrawer>

  <UDrawer v-model="panelVisible" direction="bottom">
    <div style="padding: 16px">
      <p>选项 A</p>
      <p>选项 B</p>
    </div>
  </UDrawer>
</template>
```

## 注意事项

> [!WARNING]
> - 抽屉尺寸固定：左右方向宽 `320px`，上下方向高 `320px`，四周留 `4px` 边距；当前没有 `size` / `width` prop，自定义尺寸必须覆盖样式类 `.u-drawer`。
> - 关闭按钮的绑定名是 `showClose`，不是 `closable`；没有 `mask-closable` prop，点遮罩始终会关闭。
> - `title` prop 已声明但当前版本不渲染标题；标题文字直接写在默认插槽里。
> - `closed` 事件已声明但当前版本不会触发；「开始关闭」用 `close`，「已关闭」用 `v-model` 变为 `false` 的时机判断。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` / `visible`。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 关闭按钮出现在抽屉外侧

设计行为：按钮沿抽屉滑出方向的外侧偏移 52px 悬浮（如右侧抽屉的按钮在其左边缘外侧），不是定位错误。需要按钮在抽屉内部时，禁用 `show-close` 并在插槽内容里自行放置关闭按钮（把 `v-model` 置 `false`）。

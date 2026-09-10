---
title: UDrawer 抽屉
description: "从 @veltra/desktop 导入的抽屉组件：v-model 控制显隐，从上/下/左/右四个方向滑出，带半透明遮罩与可选关闭按钮，可选 title 标题栏，点遮罩或关闭按钮关闭，closed 在退出动画全部结束后回调。"
aliases: [Drawer, 抽屉面板, 侧滑面板, SlidePanel, 侧边抽屉]
keywords: [modelValue, update:modelValue, close, closed, direction, showClose, title, DrawerDirection, DrawerMode, DrawerProps, DrawerExposed, 标题栏, 关闭动画结束, 侧滑, 滑出面板, 遮罩层, 侧边栏, 关闭按钮, 顶部通知条, 底部面板]
---

# UDrawer 抽屉

`@veltra/desktop` 导出的 `UDrawer` 是抽屉组件：用 `v-model`（`modelValue`）控制显隐，`direction` 决定从上/下/左/右哪个方向滑出，内容通过 Teleport 渲染在 `body` 下的全屏遮罩内；传 `title` 时内容区上方多一条标题栏。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDrawer } from '@veltra/desktop'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开抽屉</UButton>

  <UDrawer v-model="visible" title="用户详情" show-close>
    <p>右侧抽屉内容，默认 direction 为 'right'</p>
  </UDrawer>
</template>
```

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
  /** 抽屉标题；传入时在内容区上方渲染标题栏，不传则不渲染标题栏 */
  title?: string
}

/** 抽屉组件定义的事件 */
export interface DrawerEmits {
  /** 更新抽屉显示状态 */
  (e: 'update:modelValue', value: boolean): void
  /** 点遮罩或关闭按钮、抽屉开始关闭时触发 */
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

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `modelValue` | `boolean` | `false` | 否 | 用 `v-model` 绑定显隐 |
| `direction` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 否 | 决定滑出方向与对应过渡动画 `drawer-slide-*` |
| `showClose` | `boolean` | `false` | 否 | 关闭按钮渲染在抽屉外沿一侧（距边缘外侧 52px 处），点击关闭 |
| `title` | `string` | — | 否 | 传入时在内容区上方渲染标题栏（高 `48px`、底部一条分隔线）；不传则整块内容都来自默认插槽 |

## 方法与事件

| 名称 | 类型 | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `(value: boolean) => void` | 抽屉滑出动画结束后发出 `false`，配合 `v-model` 同步；此后遮罩才开始淡出 |
| `close` | `()` | 点遮罩或点关闭按钮时触发一次（开始关闭的时刻，非动画结束后） |
| `closed` | `()` | 退出动画全部结束后触发一次：抽屉滑出 → `v-model` 变 `false` → 遮罩淡出，遮罩与抽屉节点都已移除时 |

`UDrawer` 没有暴露任何 ref 方法（`DrawerExposed` 为空对象）；关闭只能通过点遮罩、点关闭按钮或把 `v-model` 置 `false`。

## 典型示例

### 右侧详情抽屉 + close / closed 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDrawer } from '@veltra/desktop'

const visible = ref(false)

function onClose() {
  // 点遮罩或关闭按钮时触发，此刻抽屉开始播放退出动画
  console.log('抽屉开始关闭')
}

function onClosed() {
  // 退出动画全部结束、节点已移除：适合在这里重置表单、销毁大对象
  console.log('抽屉已完全关闭')
}
</script>

<template>
  <UButton type="primary" @click="visible = true">查看详情</UButton>

  <UDrawer v-model="visible" title="用户详情" show-close @close="onClose" @closed="onClosed">
    <div style="padding: 16px">
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
> - `title` 传入即在内容区上方渲染标题栏（高 `48px`、底部一条分隔线，文字 `font-weight: 600`）；不传时标题栏不渲染也不占位，内容全部来自默认插槽。标题栏样式不可配置，需要自定义标题区（图标、按钮）时不要传 `title`，直接在默认插槽里写。
> - 三个时机按顺序发生：`close`（点遮罩/按钮）→ 抽屉滑出约 `300ms` 后 `v-model` 变 `false` → 遮罩再淡出约 `250ms` 后 `closed`。要「动画后回调」用 `closed`，不要用 `v-model` 变 `false` 的时机（那会早一个遮罩淡出）。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` / `visible`。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 关闭后需要做收尾（重置表单、销毁大对象、移除查询参数）

监听 `closed`，它在抽屉和遮罩的退出动画都结束、节点已移除后触发一次：

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'
import { UButton, UDrawer, UForm, UInput } from '@veltra/desktop'
import type { FormExposed } from '@veltra/desktop'

const visible = ref(false)
const formRef = useTemplateRef<FormExposed>('formRef')
const form = reactive({ name: '初始值' })

function onClosed() {
  // 抽屉与遮罩的退出动画都结束、节点已移除后才执行收尾
  formRef.value?.reset() // model 恢复为最近一次 props.model 变更时的快照，并清除校验
}
</script>

<template>
  <UButton @click="visible = true">编辑</UButton>

  <UDrawer v-model="visible" title="编辑" @closed="onClosed">
    <UForm ref="formRef" :model="form">
      <UInput label="姓名" field="name" />
    </UForm>
  </UDrawer>
</template>
```

不要在 `close` 里做收尾（那时动画刚开始、内容还在屏幕上），也不要用 `watch(visible)` 的 `false` 分支（比 `closed` 早一个遮罩淡出，遮罩上还能看到内容一瞬）。

### 关闭按钮出现在抽屉外侧

设计行为：按钮沿抽屉滑出方向的外侧偏移 52px 悬浮（如右侧抽屉的按钮在其左边缘外侧），不是定位错误。需要按钮在抽屉内部时，禁用 `show-close` 并在插槽内容里自行放置关闭按钮（把 `v-model` 置 `false`）。

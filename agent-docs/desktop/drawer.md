---
title: UDrawer 抽屉
description: '从 @veltra/desktop 导入的抽屉组件：v-model 控制显隐，从上/下/左/右四个方向滑出，带半透明遮罩与可选关闭按钮，可选 title 标题栏，size 自定义尺寸（左右为宽、上下为高），内容区自带留白与滚动，点遮罩、关闭按钮或按 Esc（closeOnEsc）关闭；打开时默认锁定 body 滚动（lockScroll），焦点圈在抽屉内、关闭后还原，面板带 role="dialog" 与 aria-modal，closed 在退出动画全部结束后回调。'
aliases: [Drawer, 抽屉面板, 侧滑面板, SlidePanel, 侧边抽屉]
keywords:
  [
    modelValue,
    update:modelValue,
    close,
    closed,
    direction,
    size,
    showClose,
    title,
    closeOnEsc,
    lockScroll,
    DrawerDirection,
    DrawerMode,
    DrawerProps,
    DrawerExposed,
    标题栏,
    关闭动画结束,
    侧滑,
    滑出面板,
    遮罩层,
    侧边栏,
    关闭按钮,
    Esc 关闭,
    滚动锁定,
    焦点圈,
    焦点恢复,
    aria-modal,
    顶部通知条,
    底部面板
  ]
---

# UDrawer 抽屉

`@veltra/desktop` 导出的 `UDrawer` 是抽屉组件：用 `v-model`（`modelValue`）控制显隐，`direction` 决定从上/下/左/右哪个方向滑出，内容通过 Teleport 渲染在 `body` 下的全屏遮罩内；传 `title` 时内容区上方多一条标题栏，默认插槽内容渲染在自带留白与滚动的 `u-drawer__body` 容器里。

除点遮罩与关闭按钮外，抽屉默认支持按 Esc 关闭（`closeOnEsc`），打开时锁定 `body` 滚动（`lockScroll`）并把焦点圈在面板内，关闭后焦点回到打开前的位置；面板带 `role="dialog"` 与 `aria-modal="true"`。

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
    <p>右侧抽屉内容，默认 direction 为 'right'，内容区自带留白</p>
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
  /**
   * 抽屉尺寸；左右方向为宽度，上下方向为高度，数字按 px 处理
   * 不传时走主题 token `--u-drawer-size`（默认 320px）
   */
  size?: number | string
  /** 是否显示关闭按钮。默认 false */
  showClose?: boolean
  /** 抽屉标题；传入时在内容区上方渲染标题栏，不传则不渲染标题栏 */
  title?: string
  /** 是否允许按 Esc 关闭抽屉。默认 true */
  closeOnEsc?: boolean
  /** 打开时是否锁定 body 滚动。默认 true */
  lockScroll?: boolean
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

| 参数         | 类型                                     | 默认      | 必填 | 约束                                                                                    |
| ------------ | ---------------------------------------- | --------- | :--: | --------------------------------------------------------------------------------------- |
| `modelValue` | `boolean`                                | `false`   |  否  | 用 `v-model` 绑定显隐                                                                   |
| `direction`  | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` |  否  | 决定滑出方向与对应过渡动画 `drawer-slide-*`                                             |
| `size`       | `number \| string`                       | —         |  否  | 左右方向映射为宽度、上下方向映射为高度；数字按 px，字符串原样输出（如 `'40vh'`）；内联样式，优先级高于 `--u-drawer-size` token |
| `showClose`  | `boolean`                                | `false`   |  否  | 关闭按钮渲染在抽屉外沿一侧（距边缘外侧 52px 处），点击关闭                              |
| `title`      | `string`                                 | —         |  否  | 传入时在内容区上方渲染标题栏（高 `48px`、底部一条分隔线）；不传则不渲染标题栏           |
| `closeOnEsc` | `boolean`                                | `true`    |  否  | 按 Esc 关闭抽屉；为 `false` 时 Esc 不触发关闭                                           |
| `lockScroll` | `boolean`                                | `true`    |  否  | 打开时锁定 `body` 滚动并补偿滚动条宽度，关闭后恢复原内联样式；多个遮罩叠加按计数恢复    |

## 方法与事件

| 名称                | 类型                       | 触发时机                                                                                         |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| `update:modelValue` | `(value: boolean) => void` | 点遮罩、关闭按钮或按 Esc 时立刻发出 `false`，与 `close` 同一时刻；父级直接把 `v-model` 置 `false` 时只走这条，不触发 `close` |
| `close`             | `()`                       | 点遮罩、点关闭按钮或按 Esc 时触发一次（开始关闭的时刻，非动画结束后）。父级直接把 `v-model` 置 `false` 不触发 |
| `closed`            | `()`                       | 面板滑出与遮罩淡出都结束后触发一次（`200ms`），此时遮罩与抽屉节点都已移除。退出过程中再次打开则不触发 |

`UDrawer` 没有暴露任何 ref 方法（`DrawerExposed` 为空对象）；关闭入口是点遮罩、点关闭按钮、按 Esc（`closeOnEsc` 默认开启）或把 `v-model` 置 `false`。

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
    <p>这里是抽屉主体内容</p>
  </UDrawer>
</template>
```

### 左侧导航抽屉与底部面板（size 自定义尺寸）

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

  <!-- 左右方向：size 是宽度 -->
  <UDrawer v-model="navVisible" direction="left" show-close :size="400">
    <nav>
      <ul>
        <li>首页</li>
        <li>关于</li>
      </ul>
    </nav>
  </UDrawer>

  <!-- 上下方向：size 是高度，支持字符串 -->
  <UDrawer v-model="panelVisible" direction="bottom" size="40vh">
    <p>选项 A</p>
    <p>选项 B</p>
  </UDrawer>
</template>
```

## 无障碍与交互约定

- 面板带 `role="dialog"`、`aria-modal="true"` 与 `tabindex="-1"`；传 `title` 时标题元素带 id、面板用 `aria-labelledby` 关联，不传时可通过透传的 `aria-label` 补充名称。
- 打开后焦点移入抽屉：优先第一个可聚焦元素，没有则聚焦面板自身；`Tab` / `Shift+Tab` 在面板内循环。关闭后焦点回到打开前的元素。
- Esc 监听挂在 `document` 上，不要求焦点在遮罩或抽屉内；多层遮罩叠加时只关闭最上层。`closeOnEsc: false` 可禁用。
- 打开时默认锁定 `body` 滚动（`overflow: hidden`，并按滚动条宽度补偿 `padding-right`），关闭或卸载后恢复原有内联样式；多个遮罩叠加时按引用计数恢复。
- `class` / `style` / `role` / `aria-*` 等透传属性落在抽屉面板上，可覆盖默认的无障碍属性。

## 注意事项

> [!WARNING]
>
> - 默认尺寸左右方向为宽、上下方向为高，走主题 token `--u-drawer-size`（默认 `320px`，全局可在 html 上覆盖该变量）；要按实例定制传 `size`（数字按 px，字符串原样）。四周固定留 `4px` 边距不随 `size` 变化。
> - 默认插槽内容渲染在 `u-drawer__body` 容器内：`flex: 1` 占满剩余高度、`overflow: auto` 内容过长时滚动、内边距为 `--u-gap-default`（light 主题 `8px`）。自己再包一层 `padding` 容器通常多余；需要内容贴边时用 `:deep(.u-drawer__body) { padding: 0 }` 覆盖。
> - 关闭按钮的绑定名是 `showClose`，不是 `closable`；没有 `mask-closable` prop，点遮罩始终会关闭。
> - `title` 传入即在内容区上方渲染标题栏（高 `48px`、底部一条分隔线，文字 `font-weight: 600`）；不传时标题栏不渲染也不占位。标题栏样式不可配置，需要自定义标题区（图标、按钮）时不要传 `title`，直接在默认插槽里写。
> - 点遮罩、关闭按钮或按 Esc：`close` 与 `v-model` 变为 `false` 同时发生，随后面板滑出与遮罩淡出并行，`200ms` 后 `closed`。退出过程中把 `v-model` 再设为 `true` 会取消退出并重新打开，且不触发 `closed`。收尾放在 `closed`：`close` 与 `watch(v-model)` 的 `false` 分支时面板还在屏幕上。
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

不要在 `close` 里做收尾（那时动画刚开始、内容还在屏幕上），也不要用 `watch(visible)` 的 `false` 分支（与 `close` 同时，面板滑出和遮罩淡出都还没结束）。

### 关闭按钮出现在抽屉外侧

设计行为：按钮沿抽屉滑出方向的外侧偏移 52px 悬浮（如右侧抽屉的按钮在其左边缘外侧），不是定位错误。需要按钮在抽屉内部时，禁用 `show-close` 并在插槽内容里自行放置关闭按钮（把 `v-model` 置 `false`）。

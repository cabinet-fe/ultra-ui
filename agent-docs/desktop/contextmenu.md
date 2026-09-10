---
title: UContextmenu 右键菜单
description: "从 @veltra/desktop 导入的右键菜单：组件 UContextmenu 传 mousePosition 与 menus 在鼠标位置渲染，函数式 contextmenu.pop() 一行调用；支持多级子菜单、图标列、分割线、禁用、异步回调 loading、自定义渲染与 keepOpen 内嵌交互。"
aliases: [ContextMenu, contextmenu, 上下文菜单, 鼠标右键菜单, ContextMenu组件]
keywords: [mousePosition, menus, ContextmenuItem, contextmenu.pop, destroy, divider, keepOpen, callback, children, render, disabled, ContextmenuRootDIKey, 右键弹出, 子菜单, 分割线, 异步回调, 点击外部关闭, 自定义菜单项, 鼠标位置, 函数式调用]
---

# UContextmenu 右键菜单

`@veltra/desktop` 导出组件 `UContextmenu` 与函数式入口 `contextmenu.pop()`：在鼠标位置弹出右键菜单，支持多级子菜单、图标、分割线、禁用项、异步回调（loading 期间不关闭）与 `keepOpen` 内嵌交互组件；两种用法都从 `@veltra/desktop` 导入。

## 快速上手

组件用法：容器监听 `contextmenu` 事件，把 `e.clientX / e.clientY` 存入 `mousePosition`，用 `v-if` 控制挂载，`@destroy` 复位：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UContextmenu } from '@veltra/desktop'
import type { ContextmenuItem } from '@veltra/desktop'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
  { label: '复制', callback: () => console.log('复制') },
  { divider: true },
  { label: '删除', disabled: true }
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}
</script>

<template>
  <div style="height: 200px; border: 1px dashed #ccc" @contextmenu="onContextMenu">
    在此区域右键
  </div>

  <UContextmenu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />
</template>
```

## API 签名

```ts
import type { Component } from 'vue'

/** 组件尺寸 */
export type ComponentSize = 'small' | 'default' | 'large'

/**
 * 右键菜单项
 */
export interface ContextmenuItem {
  /** 菜单名称（divider 项可空） */
  label?: string
  /** 菜单描述 */
  description?: string
  /** 菜单图标组件 */
  icon?: Component
  /** 子菜单，渲染为二级菜单，支持无限嵌套 */
  children?: ContextmenuItem[]
  /** 菜单点击时的回调；返回 Promise 时进入 loading 状态，Promise 结束后才关闭菜单 */
  callback?: () => any
  /** 是否禁用；函数形式在每次渲染时求值 */
  disabled?: boolean | (() => boolean)
  /** 渲染为分割线，忽略其余字段 */
  divider?: boolean
  /** 自定义内容组件，替代 label 文本渲染 */
  render?: Component
  /** 点击本项不触发关闭流程，供内嵌交互组件使用 */
  keepOpen?: boolean
}

/** 右键菜单组件属性 */
export interface ContextmenuProps {
  /** 鼠标位置，viewport 坐标，取 e.clientX / e.clientY。必填 */
  mousePosition: { x: number; y: number }
  /** 菜单项。必填；传函数时每次渲染时调用求值 */
  menus: ContextmenuItem[] | (() => ContextmenuItem[])
  /**
   * 菜单宽度。默认 150。
   * 传数字为固定 px；传 'max-content' 时由内容撑开（根样式 min-width: 120px）
   */
  width?: number | string
  /** 组件尺寸，只影响菜单项内边距与字号。默认 'default' */
  size?: ComponentSize
}

/** 右键菜单组件定义的事件 */
export interface ContextmenuEmits {
  /** 菜单关闭且退场动画结束后触发，用于复位外部的 v-if */
  (e: 'destroy'): void
}

/** 组件 ref 暴露（DeconstructValue 解包后的形态）。当前为空对象：UContextmenu 没有暴露方法 */
export interface ContextmenuExposed {}

/**
 * 函数式右键菜单：在 document.body 渲染一个菜单实例并立即显示。
 * 同一时刻只保留最新一个实例（再次 pop 会先卸载上一个）。
 * 无返回值，也没有手动关闭句柄；关闭由内部完成：点击菜单外部或菜单项回调执行完毕
 */
export declare const contextmenu: {
  pop(options: ContextmenuProps): void
}
```

## 参数说明

### ContextmenuProps

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `mousePosition` | `{ x: number; y: number }` | — | 是 | viewport 坐标（`e.clientX` / `e.clientY`）；菜单在该点右下 1px 处显示，靠近屏幕右/下半时自动改用右/下边缘锚定 |
| `menus` | `ContextmenuItem[] \| (() => ContextmenuItem[])` | — | 是 | 传函数可在每次打开时动态生成菜单项 |
| `width` | `number \| string` | `150` | 否 | 数字按 px；`'max-content'` 由内容撑开，根样式带 `min-width: 120px` |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | 否 | 影响菜单项内边距与字号 |

### ContextmenuItem

| 字段 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `label` | `string` | — | 否 | `divider: true` 时可空 |
| `description` | `string` | — | 否 | 菜单描述文字 |
| `icon` | `Component` | — | 否 | 同层任一项有 `icon` 时整层预留图标列对齐；异步回调执行中显示 loading 图标 |
| `children` | `ContextmenuItem[]` | — | 否 | 非空时渲染为子菜单，hover 打开、移开 250ms 后关闭，支持无限层级，贴屏幕右缘自动向左展开 |
| `callback` | `() => any` | — | 否 | 点击时调用；返回 `Promise` 时菜单保持打开并显示 loading，Promise 结束（含 reject）后关闭 |
| `disabled` | `boolean \| (() => boolean)` | `false` | 否 | 禁用项不响应点击、不触发关闭 |
| `divider` | `boolean` | `false` | 否 | 为 `true` 时渲染 `<li role="separator">`，忽略其余字段 |
| `render` | `Component` | — | 否 | 渲染该组件替代 `label` 文本；组件内点击事件不会冒泡触发菜单项点击 |
| `keepOpen` | `boolean` | `false` | 否 | 点击本项不进入关闭流程；配合 `render` 内嵌交互组件，需要关闭时手动调用注入的 `onItemClickEnd()` |

## 方法与事件

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `destroy`（组件事件） | `()` | 菜单关闭、`zoom-in` 退场动画结束后触发。必须监听并复位外部的 `v-if`，否则菜单无法再次打开 |
| `contextmenu.pop` | `(options: ContextmenuProps) => void`，同步，无返回值 | 函数式入口。挂载到 `document.body`；点菜单外部或菜单项回调完成后内部自动卸载，没有 `close()` 之类的手动关闭方法 |

## 典型示例

### 图标、异步回调与动态禁用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UContextmenu, UCheckbox } from '@veltra/desktop'
import type { ContextmenuItem } from '@veltra/desktop'
import { Copy, Delete, Edit } from '@veltra/icons/normal'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })
const canEdit = ref(false)

function getMenus(): ContextmenuItem[] {
  return [
    { label: '编辑', icon: Edit, disabled: () => !canEdit.value, callback: () => console.log('编辑') },
    { label: '复制', icon: Copy, callback: () => console.log('复制') },
    {
      label: '删除',
      icon: Delete,
      // 异步执行：菜单保持打开并显示 loading，2 秒后自动关闭
      callback: async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log('删除完成')
      }
    }
  ]
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}
</script>

<template>
  <UCheckbox v-model="canEdit">允许编辑</UCheckbox>
  <div style="height: 200px; border: 1px dashed #ccc" @contextmenu="onContextMenu">
    右键打开动态菜单
  </div>

  <UContextmenu
    v-if="visible"
    :mouse-position="pos"
    :menus="getMenus"
    @destroy="visible = false"
  />
</template>
```

### 多级子菜单与分割线

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UContextmenu } from '@veltra/desktop'
import type { ContextmenuItem } from '@veltra/desktop'
import { Edit } from '@veltra/icons/normal'

const visible = ref(false)
const pos = ref({ x: 0, y: 0 })

const menus: ContextmenuItem[] = [
  {
    label: '新建',
    icon: Edit,
    children: [
      { label: '文档', callback: () => console.log('新建文档') },
      { label: '表格', callback: () => console.log('新建表格') },
      {
        label: '更多',
        children: [{ label: '幻灯片', callback: () => console.log('新建幻灯片') }]
      }
    ]
  },
  { divider: true },
  { label: '重命名', callback: () => console.log('重命名') }
]

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
  pos.value = { x: e.clientX, y: e.clientY }
  visible.value = true
}
</script>

<template>
  <div style="height: 200px; border: 1px dashed #ccc" @contextmenu="onContextMenu">
    右键查看多级菜单
  </div>

  <UContextmenu
    v-if="visible"
    :mouse-position="pos"
    :menus="menus"
    :width="180"
    @destroy="visible = false"
  />
</template>
```

### 函数式 contextmenu.pop() 与 keepOpen 自定义项

```vue
<script setup lang="ts">
import { defineComponent, h, inject } from 'vue'
import { UButton, contextmenu } from '@veltra/desktop'
import { ContextmenuRootDIKey, type ContextmenuItem } from '@veltra/desktop'

// keepOpen 项的内嵌组件：注入根实例，点击按钮后手动结束并关闭菜单
const CountItem = defineComponent({
  name: 'CountItem',
  setup() {
    const root = inject(ContextmenuRootDIKey)
    return () =>
      h('button', { type: 'button', onClick: () => root?.onItemClickEnd() }, '确认并关闭')
  }
})

const menus: ContextmenuItem[] = [
  { label: '打开', callback: () => console.log('打开') },
  { divider: true },
  { keepOpen: true, render: CountItem }
]

function onPopContextMenu(e: MouseEvent) {
  e.preventDefault()
  // 无返回值；点外部或菜单项回调完成后自动卸载
  contextmenu.pop({
    mousePosition: { x: e.clientX, y: e.clientY },
    menus
  })
}
</script>

<template>
  <div style="height: 200px; border: 1px dashed #ccc" @contextmenu="onPopContextMenu">
    右键调用 contextmenu.pop()
  </div>

  <UButton style="margin-top: 12px" @click="contextmenu.pop({
    mousePosition: { x: 200, y: 200 },
    menus: [{ label: '固定位置菜单', callback: () => console.log('clicked') }]
  })">在固定坐标弹出</UButton>
</template>
```

## 注意事项

> [!WARNING]
> - 两种用法 import 不同：组件用 `import { UContextmenu } from '@veltra/desktop'`，函数式用 `import { contextmenu } from '@veltra/desktop'`；`ContextmenuItem` 等类型同样从 `@veltra/desktop` 以 `import type` 导入。
> - 组件用法必须监听 `destroy` 并复位 `v-if`：菜单挂载即显示、关闭即销毁，显隐完全由外部 `v-if` 控制，没有 `v-model`。
> - 菜单通过 Teleport 渲染到 `body`，不会被父容器的 `overflow: hidden` 裁剪；定位坐标必须是 viewport 坐标（`e.clientX` / `e.clientY`），不是相对容器的偏移。
> - `@contextmenu` 监听器要用 `e.preventDefault()` 阻止浏览器默认菜单，否则两个菜单同时出现。
> - 关闭途径只有两个：点击菜单外部（回调 loading 期间不关闭）和菜单项 `callback` 执行完毕；异步 `callback` 返回 `Promise` 时菜单保持打开直到 Promise 结束。
> - `keepOpen: true` 的项点击后不会关闭菜单；要主动关闭，在 `render` 组件里 `inject(ContextmenuRootDIKey)` 后调用 `onItemClickEnd()`。
> - `divider: true` 的项只渲染分割线，`label`、`callback` 等字段全部忽略。
> - 函数式 `contextmenu.pop()` 同一时刻只存在一个实例：菜单开着时再次 `pop` 会先卸载上一个；没有手动关闭句柄。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 右键菜单第二次点不开

`destroy` 事件没有复位 `v-if`：菜单关闭销毁后 `visible` 仍是 `true`，再次右键赋值 `true` 不触发重新挂载。修复：

```vue
<UContextmenu v-if="visible" :mouse-position="pos" :menus="menus" @destroy="visible = false" />
```

### 菜单和浏览器默认菜单同时弹出

`@contextmenu` 处理函数没有阻止默认行为。修复：在处理函数第一行调用 `e.preventDefault()`。

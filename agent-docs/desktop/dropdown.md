---
title: UDropdown 下拉菜单
description: "从 @veltra/desktop 导入的下拉菜单组件：hover/点击/完全自定义三种触发方式，浮层自动定位与翻转，宽度默认跟随触发元素，支持 v-model:visible 受控与 ref 调用 open/close/updateDropdown。"
aliases: [Dropdown, 下拉框, 下拉, Popover, DropDown]
keywords: [trigger, visible, update:visible, disabled, contentClass, contentStyle, contentTag, open, close, updateDropdown, DropdownExposed, minWidth, keydown, 自定义触发, 悬浮菜单, 点击弹出, 受控显隐, 虚拟锚点, 嵌套下拉]
---

# UDropdown 下拉菜单

`@veltra/desktop` 导出的 `UDropdown` 是下拉菜单（下拉浮层）组件：`#trigger` 插槽放触发元素，`#content` 插槽放浮层内容，浮层 Teleport 渲染并自动定位在触发元素下方，空间不足自动翻转到上方。

## 快速上手

```vue
<script setup lang="ts">
import { UButton, UDropdown } from '@veltra/desktop'
</script>

<template>
  <UDropdown>
    <template #trigger>
      <UButton>悬浮打开</UButton>
    </template>

    <template #content>
      <ul style="padding: 8px 12px; margin: 0; list-style: none">
        <li>编辑</li>
        <li>复制</li>
        <li>删除</li>
      </ul>
    </template>
  </UDropdown>
</template>
```

## API 签名

```ts
import type { CSSProperties } from 'vue'

/** 下拉框组件属性 */
export interface DropdownProps {
  /** 触发方式。默认 'hover' */
  trigger?: 'hover' | 'click' | 'custom'
  /** 浮层宽度，如 '200px'。默认跟随触发元素宽度 */
  width?: string
  /** 最小宽度，写入浮层内联样式 min-width */
  minWidth?: string
  /** 内容容器标签。默认 'div' */
  contentTag?: string
  /** 内容容器类，字符串或字符串数组 */
  contentClass?: unknown
  /** 内容容器样式 */
  contentStyle?: CSSProperties | string
  /** 显示下拉框。默认 false，配合 @update:visible 使用（v-model:visible） */
  visible?: boolean
  /** 禁用。为 true 时不绑定任何 hover/click 触发事件 */
  disabled?: boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  /** 下拉框显示或隐藏时发出，配合 v-model:visible */
  (e: 'update:visible', visible: boolean): void
  /** 浮层内容区内键盘按下时触发（焦点需在内容区内） */
  (e: 'keydown', event: KeyboardEvent): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态，
 * 通过 const dropdownRef = ref<DropdownExposed>() 访问）
 */
export interface DropdownExposed {
  /** 打开下拉菜单。config.trigger 传入 HTMLElement 时以该元素为定位锚点（虚拟触发）。同步，无返回值 */
  open: (config?: { trigger?: HTMLElement }) => void
  /** 关闭。trigger 为 'hover' 时延迟 200ms 执行，其余立即执行。同步，无返回值 */
  close: () => void
  /** 重新计算浮层位置，浮层内容尺寸变化后调用（级联/动态内容场景）。同步，无返回值 */
  updateDropdown: () => void
}
```

## 参数说明

| 参数 | 类型 | 默认 | 必填 | 约束 |
| --- | --- | --- | :---: | --- |
| `trigger` | `'hover' \| 'click' \| 'custom'` | `'hover'` | 否 | `hover` 悬浮开、移开 200ms 后关；`click` 点击切换、点外部关；`custom` 不绑定事件，必须用 ref 的 `open`/`close` |
| `width` | `string` | 跟随触发元素宽度 | 否 | 写入浮层内联 `width`，如 `'200px'` |
| `minWidth` | `string` | — | 否 | 写入浮层内联 `min-width` |
| `contentTag` | `string` | `'div'` | 否 | 浮层内容容器的 HTML 标签名 |
| `contentClass` | `unknown` | — | 否 | 追加在 `u-dropdown__content` 之后的类，支持数组 |
| `contentStyle` | `CSSProperties \| string` | — | 否 | 写入浮层内联样式 |
| `visible` | `boolean` | `false` | 否 | 受控显隐：传 `visible` + 监听 `@update:visible`，即 `v-model:visible`；不传则组件内部自管理 |
| `disabled` | `boolean` | `false` | 否 | 为 `true` 时 hover/click 事件处理器为空，浮层无法通过交互打开 |

## 方法与事件

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| `update:visible` | `(visible: boolean) => void` | 内部 `open`/`close` 改变显隐时发出；受控时必须回写，否则视图不变 |
| `keydown` | `(event: KeyboardEvent) => void` | 浮层内容区上的原生 `keydown` 转发；焦点需落在内容区（如内容里有可聚焦元素） |
| `open`（ref） | `(config?: { trigger?: HTMLElement }) => void`，同步 | 打开浮层；`config.trigger` 指定定位锚点元素（虚拟触发），不传则以 `#trigger` 插槽元素为锚点 |
| `close`（ref） | `() => void`，同步 | 关闭浮层；`trigger='hover'` 时延迟 200ms（期间重新 `open` 会取消关闭） |
| `updateDropdown`（ref） | `() => void`，同步 | 重新计算浮层位置；浮层内容尺寸动态变化后调用 |

## 典型示例

### 点击触发 + 受控显隐 + Esc 关闭

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDropdown } from '@veltra/desktop'

const visible = ref(false)

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    visible.value = false
  }
}
</script>

<template>
  <UDropdown
    trigger="click"
    width="200px"
    v-model:visible="visible"
    @keydown="handleKeydown"
  >
    <template #trigger>
      <UButton>受控下拉</UButton>
    </template>

    <template #content>
      <div style="padding: 8px 12px" tabindex="0">按 Esc 关闭</div>
    </template>
  </UDropdown>
</template>
```

### trigger="custom" + 虚拟锚点：在其他元素处弹出

```vue
<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { UButton, UDropdown } from '@veltra/desktop'
import type { DropdownExposed } from '@veltra/desktop'

const dropdownRef = useTemplateRef<DropdownExposed>('dropdown')
const anchorRef = ref<HTMLSpanElement | null>(null)

function openAtAnchor() {
  // 以 span 为锚点打开浮层，而不是以 #trigger 插槽元素
  dropdownRef.value?.open({ trigger: anchorRef.value ?? undefined })
}
</script>

<template>
  <UButton @click="openAtAnchor">在锚点处打开</UButton>
  <span ref="anchorRef" style="margin-left: 24px">锚点位置</span>

  <UDropdown ref="dropdown" trigger="custom" width="160px">
    <template #content>
      <div style="padding: 8px 12px">自定义触发的菜单</div>
    </template>
  </UDropdown>
</template>
```

### hover 触发 + 宽度与禁用

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { UButton, UDropdown } from '@veltra/desktop'

const disabled = ref(false)
</script>

<template>
  <UButton @click="disabled = !disabled">切换 disabled：{{ disabled }}</UButton>

  <UDropdown :disabled="disabled" width="240px" min-width="120px">
    <template #trigger>
      <UButton>悬浮打开（宽度固定 240px）</UButton>
    </template>

    <template #content>
      <ul style="padding: 8px 12px; margin: 0; list-style: none">
        <li>第一项</li>
        <li>第二项</li>
      </ul>
    </template>
  </UDropdown>
</template>
```

## 注意事项

> [!WARNING]
> - 显隐绑定名是 `visible`（`v-model:visible`），不是 `modelValue`（`v-model` 不生效）。
> - 浮层定位依赖 `@veltra/compositions` 的 `usePop`（默认在触发元素下方、start 对齐，空间不足自动翻转到上方）；本篇不展开 `usePop`，调整定位需通过锚点元素而非组件 prop。
> - 浮层内容必须写在 `#content` 插槽，触发元素写在 `#trigger` 插槽；直接写默认插槽不会渲染。
> - `trigger="custom"` 时组件不绑定任何 hover/click 事件，必须通过 ref 调用 `open`/`close`；`open({ trigger })` 可指定任意元素为定位锚点。
> - `trigger="click"` 时点击浮层外部关闭、点击触发元素本身不关闭（由触发元素点击切换）；`trigger="hover"` 时移入浮层保持打开。
> - `trigger="hover"` 的 `close()`（包括鼠标移出）延迟 200ms 执行，用于缓冲「移出再移回」；期间调用 `open()` 会取消关闭。
> - `width` 默认跟随触发元素宽度；需要内容撑开时显式传 `width` 并配合 `min-width`。
> - 嵌套下拉（浮层内再放 `UDropdown`）：子下拉打开期间父浮层保持显示，不会因焦点移入子浮层而关闭。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 写了 `v-model` 但显隐不受控

`UDropdown` 的受控绑定是 `visible`，不是 `modelValue`。修复：

```vue
<UDropdown v-model:visible="visible" trigger="click">
  <template #trigger><UButton>打开</UButton></template>
  <template #content><div>内容</div></template>
</UDropdown>
```

### 受控时点了打开但视图不更新

受控模式下组件内部改显隐时只发出 `update:visible`，不会自己改 `visible` prop。必须回写（`v-model:visible="visible"` 已包含回写；手动绑定时写 `:visible="visible" @update:visible="visible = $event"`）。

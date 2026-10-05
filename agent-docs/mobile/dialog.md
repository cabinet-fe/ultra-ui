---
title: UDialog 对话框（@veltra/mobile 移动端）
description: '@veltra/mobile 导出的移动端模态对话框：NutUI 惯例居中卡片，标题与正文默认居中；footer 为内置水平按钮组（取消/确认等宽铺满、主操作居右、操作区高度 ≥44px，可纵向堆叠），不传 #footer 插槽即用内置按钮并发出 confirm/cancel。打开期间背景滚动锁定、完全关闭后恢复原滚动位置。'
aliases: [Dialog, Modal, 弹窗, 模态框, 移动端对话框]
keywords:
  [
    modelValue,
    update:modelValue,
    confirm,
    cancel,
    closed,
    confirmText,
    cancelText,
    showCancel,
    verticalActions,
    contentAlign,
    fullscreen,
    fade-scale,
    DialogExposed,
    DialogContentAlign,
    header,
    footer,
    trigger,
    modal,
    居中卡片,
    按钮组,
    纵向按钮,
    全屏,
    遮罩,
    点击遮罩关闭,
    滚动锁定,
    内容滚动,
    表单弹窗,
    z-index,
    移动端弹窗
  ]
---

# UDialog 对话框（@veltra/mobile 移动端）

`@veltra/mobile` 导出的 `UDialog` 是移动端模态对话框组件：按 NutUI 惯例以**居中卡片**呈现（标题与正文默认居中），用 `v-model`（`modelValue`）或 `#trigger` 插槽控制显隐，内容通过 Teleport 渲染在 `body` 下，带遮罩、标题栏与关闭按钮；`fullscreen` 开启全屏形态。

footer 是**水平按钮组**：不传 `#footer` 插槽时内置「取消 / 确认」两个按钮（等宽铺满、主操作居右、操作区高度不低于 44px，NutUI 惯例 48px），点击分别发出 `cancel` / `confirm` 并关闭；传插槽时按钮组整体由插槽接管（布局仍是等宽铺满）。`verticalActions` 可把按钮组改为纵向堆叠。打开期间背景滚动被锁定，完全关闭后恢复原滚动位置。

卡片**自带内容滚动**：整体高度上限是卡片 `max-height: 86%`，相对遮罩层内容盒解析——遮罩层 `position: fixed; inset: 0` 且自带 `padding: var(--u-gap-large)` 上下留白，实际约为（视口高 − 上下留白）× 86%，略小于 `86vh`。内容超出时在内容区（`.um-dialog__body`）自动滚动，标题栏与 footer 吸顶/吸底。因此**不要**在内容里再写 `height` / `max-height` / `overflow: auto`，也不要自己包滚动容器。卡片宽度固定 `max-width: 320px`（无 `size` prop），不需要外部设置宽度。

## 快速上手

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
</script>

<template>
  <UButton @click="visible = true">打开</UButton>

  <UDialog v-model="visible" title="提示" @confirm="onConfirm">
    <p>这是对话框内容</p>
  </UDialog>
</template>
```

视觉初始化前提：应用入口必须 `import '@veltra/styles/normalize'` 并调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。组件按需样式引入路径为 `@veltra/mobile/components/dialog/style`（内置 footer 按钮依赖的 button 样式已随其引入）。

## API 签名

```ts
/** 对话框正文水平对齐（默认居中，表单等场景可切左对齐） */
export type DialogContentAlign = 'left' | 'center' | 'right'

/** 对话框过渡动画名称 */
export type DialogTransition = 'fade-scale'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏。默认 false */
  modelValue?: boolean
  /** 弹框标题，header 的别名 */
  title?: string
  /** 弹框头部内容，优先于 title */
  header?: string
  /** 确认按钮文字。默认 '确认'；传入 #footer 插槽时整个按钮组由插槽接管 */
  confirmText?: string
  /** 取消按钮文字。默认 '取消' */
  cancelText?: string
  /** 是否显示取消按钮。默认 true */
  showCancel?: boolean
  /** footer 按钮组纵向堆叠。默认 false */
  verticalActions?: boolean
  /** 正文水平对齐。默认 'center' */
  contentAlign?: DialogContentAlign
  /** 显示模态遮罩。默认 true */
  modal?: boolean
  /** 全屏：卡片铺满视口、去圆角。默认 false */
  fullscreen?: boolean
  /** 弹框过渡动画。默认 'fade-scale'，当前仅此一个取值 */
  transition?: DialogTransition
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 点击内置确认按钮（随点击关闭） */
  (e: 'confirm'): void
  /** 点击内置取消按钮（随点击关闭） */
  (e: 'cancel'): void
  /** 遮罩淡出动画完全结束后触发 */
  (e: 'closed'): void
}

/**
 * 组件 ref 上暴露的属性（DeconstructValue 解包后的形态，
 * 通过 const dialogRef = ref<DialogExposed>() 访问）
 */
export interface DialogExposed {
  /** 关闭对话框，等价于把 modelValue 置为 false。同步，无返回值 */
  close: () => void
}
```

## 参数说明

| 参数              | 类型                                  | 默认       | 必填 | 约束                                                                                          |
| ----------------- | ------------------------------------- | ---------- | :--: | --------------------------------------------------------------------------------------------- |
| `modelValue`      | `boolean`                             | `false`    |  否  | 用 `v-model` 绑定；`false` 时整棵弹框 DOM 不渲染                                              |
| `title`           | `string`                              | —          |  否  | 标题文字（居中、加粗、最多两行省略）；`header` 存在时被忽略                                   |
| `header`          | `string`                              | —          |  否  | 标题文字，优先于 `title`；要自定义结构时改用 `#header` 插槽                                   |
| `confirmText`     | `string`                              | `'确认'`   |  否  | 内置确认按钮文字；主操作，渲染在按钮组最右（纵向堆叠时最下）                                  |
| `cancelText`      | `string`                              | `'取消'`   |  否  | 内置取消按钮文字                                                                               |
| `showCancel`      | `boolean`                             | `true`     |  否  | `false` 时不渲染内置取消按钮，按钮组只剩确认                                                  |
| `verticalActions` | `boolean`                             | `false`    |  否  | `true` 时 footer 按钮组纵向堆叠（多操作 / 长文案场景），按钮全宽                              |
| `contentAlign`    | `'left' \| 'center' \| 'right'`       | `'center'` |  否  | 正文水平对齐；表单等左对齐内容传 `'left'`                                                     |
| `modal`           | `boolean`                             | `true`     |  否  | `true` 时显示遮罩且点遮罩关闭；`false` 时无遮罩背景且遮罩层 `pointer-events: none`，点击外部不关闭 |
| `fullscreen`      | `boolean`                             | `false`    |  否  | `true` 时卡片 `width` / `height` 100%、去 `max-width` / `max-height` 与圆角，铺满视口，正文与按钮组让出底部安全区 |
| `transition`      | `'fade-scale'`                       | `'fade-scale'` |  否  | 当前仅接受 `'fade-scale'`                                                                  |

旧版的 `size` prop（`small` / `default` / `large` 宽度档）已移除：卡片宽度固定 `max-width: 320px`（NutUI 惯例），传 `size` 不再有任何效果。

## 方法与事件

| 名称                | 类型                         | 触发时机                                                                       |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `update:modelValue` | `(visible: boolean) => void` | 点遮罩（`modal: true` 时）、点右上角关闭按钮、点内置取消/确认按钮或调用 `close()` 时发出，配合 `v-model` 同步外部状态 |
| `confirm`           | `()`                         | 点击内置确认按钮时发出一次，随后自动关闭（先发事件再关闭）                      |
| `cancel`            | `()`                         | 点击内置取消按钮时发出一次，随后自动关闭                                        |
| `closed`            | `()`                         | 遮罩淡出过渡 `after-leave` 后触发一次，此时 DOM 已卸载、背景滚动已恢复，适合清理表单状态 |
| `close`（ref 方法） | `() => void`，同步，无返回值 | 主动关闭，内部把 `modelValue` 置 `false`                                       |

插槽作用域：

- `#default`：无作用域；内容渲染在组件内容区（`.um-dialog__body`），默认居中（`contentAlign` 控制），高度上限为遮罩内容盒高度的 `86%`（全屏时无上限），超出自动滚动。内容里禁止再写 `height`、`max-height`、`overflow` 或自建滚动容器。
- `#footer="{ close }"`：`close: () => void`，等价于 ref 上的 `close()`；传入即接管整个按钮组，内置按钮与 `confirm` / `cancel` 事件不再生效，布局仍是水平等宽铺满（主操作写在最后即居右）。
- `#header`：无作用域；替换标题文字区域（仍居中），标题栏与右上角关闭按钮保留。
- `#trigger`：无作用域；渲染在遮罩之外，点击触发元素在打开 / 关闭间切换。

标题栏始终渲染（含右上角关闭按钮，触控热区不小于 44x44）；标题文字最多两行，超出省略。

**滚动锁定**：打开期间背景（未注册弹层宿主时为 body）滚动被锁定，iOS Safari 下也能锁住橡皮筋滚动；`closed` 触发的同时恢复原滚动位置，内容区自身照常滚动。

## 典型示例

### 内置按钮组：confirm / cancel 回调

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)

function onConfirm() {
  console.log('已确认') // 事件发出后对话框自动关闭
}
</script>

<template>
  <UButton @click="visible = true">删除</UButton>

  <UDialog
    v-model="visible"
    title="删除确认"
    confirm-text="删除"
    cancel-text="再想想"
    @confirm="onConfirm"
  >
    <p>删除后不可恢复，确认删除这条记录吗？</p>
  </UDialog>
</template>
```

### 仅确认按钮与纵向堆叠

```vue
<script setup lang="ts">
import { reactive } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const visible = reactive({ notice: false, vertical: false })
</script>

<template>
  <UButton @click="visible.notice = true">公告</UButton>
  <UButton @click="visible.vertical = true">清除缓存</UButton>

  <!-- show-cancel 为 false：按钮组只剩确认 -->
  <UDialog v-model="visible.notice" title="公告" confirm-text="知道了" :show-cancel="false">
    <p>系统将于今晚 23:00 维护。</p>
  </UDialog>

  <!-- vertical-actions：按钮组纵向堆叠，按钮全宽 -->
  <UDialog v-model="visible.vertical" title="清除缓存" vertical-actions>
    <p>将清除 128MB 缓存文件。</p>
  </UDialog>
</template>
```

### footer 插槽接管按钮组（校验通过后再关闭）

```vue
<script setup lang="ts">
import { reactive, ref, useTemplateRef } from 'vue'

import { UButton, UDialog, UForm, UInput } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
const formRef = useTemplateRef<{ validate: () => Promise<boolean> }>('form')
const formData = reactive({ name: '' })

async function handleConfirm(close: () => void) {
  const valid = await formRef.value?.validate()
  if (valid) {
    console.log(formData.name) // => 输入的名称
    close()
  }
}
</script>

<template>
  <UButton @click="visible = true">新建</UButton>

  <!-- 表单场景配合 content-align="left"，footer 按钮组由插槽接管（主操作写在最后即居右） -->
  <UDialog v-model="visible" title="新建" content-align="left">
    <UForm ref="form" :model="formData">
      <UInput label="名称" field="name" :rules="{ required: true }" />
    </UForm>

    <template #footer="{ close }">
      <UButton @click="close()">取消</UButton>
      <UButton type="primary" @click="handleConfirm(close)">确认</UButton>
    </template>
  </UDialog>
</template>
```

### 全屏形态与长内容滚动

`fullscreen` 铺满视口（正文与按钮组让出底部安全区）；非全屏时卡片高度上限为遮罩内容盒高度的 `86%`（略小于 `86vh`），内容超出在内容区自动滚动，标题栏与 footer 不动。只写内容需要的样式，**不要**再给内容加 `height` / `max-height` / `overflow: auto`。

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const fullscreenVisible = ref(false)
const longVisible = ref(false)
const rows = Array.from({ length: 30 }, (_, i) => `第 ${i + 1} 行内容`)
</script>

<template>
  <UButton type="primary" @click="fullscreenVisible = true">全屏对话框</UButton>
  <UButton @click="longVisible = true">查看长内容</UButton>

  <!-- 全屏：卡片铺满视口、去圆角，内容超高时在内容区滚动 -->
  <UDialog v-model="fullscreenVisible" fullscreen title="全屏">
    <p v-for="row in rows" :key="row">{{ row }}</p>
  </UDialog>

  <!-- 非全屏：高度上限为遮罩内容盒的 86%，超出自动滚动，无需自写高度与滚动样式 -->
  <UDialog v-model="longVisible" title="条款">
    <p v-for="row in rows" :key="row">{{ row }}</p>
  </UDialog>
</template>
```

## 注意事项

> [!WARNING]
>
> - **footer 是移动端惯例水平按钮组**：内置按钮（或插槽子项）等宽铺满、主操作居右，操作区高度不低于 44px（NutUI 惯例 48px）；不是桌面式的右对齐排列。`verticalActions` 可纵向堆叠。
> - **打开期间背景滚动锁定**（未注册弹层宿主时锁 body，iOS Safari 下也能锁住橡皮筋滚动），`closed` 后恢复原滚动位置；内容区自身照常滚动。
> - 旧版 `size` prop 已移除，卡片宽度固定 `max-width: 320px`；桌面端 `UDialog` 的 `size` 仍存在但只影响标题栏内边距与字号，两端口径不同。
> - 标题与正文**默认居中**（NutUI 惯例），标题最多两行省略；左对齐内容（表单等）传 `content-align="left"`。
> - 移动端是**居中卡片 + fullscreen 全屏形态**；桌面端 `fullscreen` 已声明但无行为，全屏走标题栏最大化按钮。
> - 移动端**无标题栏拖拽、无最大化/还原按钮、无 Esc 关闭**（这些是桌面端行为）；关闭途径：点遮罩（`modal: true` 时）、点右上角关闭按钮、点内置取消/确认按钮、调用 ref 的 `close()`、点击 `#trigger` 触发元素切换。
> - 移动端 `#default` 插槽**无作用域参数**（桌面端有 `maximized` 参数）；全屏形态由 `fullscreen` prop 声明式控制。
> - 组件**自带内容滚动**：`#default` 内容渲染在内容区，超出高度自动滚动。**禁止**在内容上再写 `height` / `max-height` / `overflow: auto`，也禁止自建滚动容器或全屏定位。
> - 显隐绑定名是 `modelValue`（`v-model`），不是 `open` 或 `visible`。
> - `title` 与 `header` 都是标题文字且 `header` 优先；要自定义标题结构用 `#header` 插槽，而不是传对象。
> - 没有拦截关闭的钩子（没有 `before-close`）：点遮罩、点关闭按钮、点内置按钮都会直接关闭；需要校验通过才能关闭的流程，用 `#footer` 插槽自己控制 `v-model`。
> - 每次关闭后弹框内容即卸载，重新打开会重新挂载；需要保留的表单数据必须放在弹框组件外部。
> - 多个弹框叠加时按打开顺序自动递增 `z-index`，后开的在上层；滚动锁定嵌套计数，全部关闭后背景才恢复。
> - 示例独立成页运行时必须先初始化主题：`import '@veltra/styles/normalize'` 后调用 `@veltra/styles/theme` 的 `loadTheme()`，否则 `--u-*` token 为空、组件无颜色。

## 常见问题

### 从旧版迁移：size 不生效、footer 多了按钮

`size` prop 已随 NutUI 惯例重构移除（宽度固定 `max-width: 320px`），删除该传参即可。footer 现在默认渲染内置「取消 / 确认」按钮组：不需要操作按钮时传 `confirm-text` 自定义文字并 `:show-cancel="false"`；要完全自定义就用 `#footer` 插槽接管（内置按钮与 `confirm` / `cancel` 事件随之失效）。

### confirm 之后需要先做异步再关闭

内置确认按钮点击后必然关闭。需要在关闭前校验 / 提交的流程改用 `#footer` 插槽：按钮回调里自行控制 `v-model`（或调用插槽作用域的 `close()`），通过后再关闭。

```vue
<script setup lang="ts">
import { ref } from 'vue'

import { UButton, UDialog } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)

async function submit(close: () => void) {
  const ok = await Promise.resolve(true) // 换成真实提交
  if (ok) close()
}
</script>

<template>
  <UDialog v-model="visible" title="提交">
    <p>内容</p>
    <template #footer="{ close }">
      <UButton @click="close()">取消</UButton>
      <UButton type="primary" @click="submit(close)">提交</UButton>
    </template>
  </UDialog>
</template>
```

### 关闭动画期间页面闪烁或状态残留

原因：在 `close` / `update:modelValue` 时机做清理，此刻退场动画尚未结束、DOM 仍在。修复：清理逻辑放到 `@closed`（遮罩淡出过渡完全结束、DOM 已卸载、背景滚动已恢复后触发一次）。

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'

import { UButton, UDialog, UForm, UInput } from '@veltra/mobile'
import '@veltra/mobile/components/dialog/style'
import '@veltra/mobile/components/form/style'
import '@veltra/mobile/components/input/style'
import '@veltra/mobile/components/button/style'

const visible = ref(false)
const formData = reactive({ name: '' })

function onClosed() {
  // DOM 已卸载，重置表单不会引发视图闪烁
  formData.name = ''
}
</script>

<template>
  <UButton @click="visible = true">新建</UButton>
  <UDialog v-model="visible" title="新建" content-align="left" @closed="onClosed">
    <UForm :model="formData">
      <UInput label="名称" field="name" />
    </UForm>
  </UDialog>
</template>
```
